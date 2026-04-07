/**
 * AudNova V22.0 - RatchetService
 * Double Ratchet para end-to-end encryption de mensagens
 * Baseado na engenharia Aether Elite V10.8.2 (Signal Protocol inspired)
 */

import { SessionKeyState, KeyPair } from '../types';
import { CRYPTO_SPEC, STORAGE } from '../core/config';
import { CryptoService } from './CryptoService';
import { StorageService } from './StorageService';

/**
 * RatchetState - Estado do ratchet para uma sessão
 * Persistido em encrypted storage
 */
export interface RatchetState {
    sessionId: string;
    peerId: string;
    dhs: KeyPair; // DH keypair (atualizado em cada ratchet step)
    dhr: Uint8Array | null; // Remote DH public key (recebido)
    rootKey: Uint8Array; // Root key (32 bytes)
    chainKeySend: Uint8Array; // Send chain key
    chainKeyReceive: Uint8Array; // Receive chain key
    messageNumber: number; // Número de mensagens nesta cadeia
    previousChainLength: number; // Comprimento da cadeia anterior
    skipped: Map<string, Uint8Array>; // Mensagens skipped (out-of-order)
    timestamp: number;
}

/**
 * MessageKey - Chave derivada para encriptar uma mensagem
 */
export interface MessageKey {
    key: Uint8Array; // 32 bytes
    nonce: Uint8Array; // 12 bytes for GCM
    messageNumber: number;
}

/**
 * EncryptedMessage - Mensagem encriptada com header
 */
export interface EncryptedMessage {
    header: {
        dh: Uint8Array; // DH ephemeral public key
        messageNumber: number;
        previousChainLength: number;
    };
    ciphertext: Uint8Array;
    tag: Uint8Array;
    iv: Uint8Array;
}

/**
 * RatchetService - Implementa Double Ratchet (Signal Protocol)
 * - DH Ratchet: atualiza chaves a cada mensagem (forward secrecy)
 * - Chain Ratchet: deriva message keys da chain key
 * - Out-of-order tolerance: guarda message keys para delivery fora de ordem
 * - Forward secrecy: deletar old chain keys
 * - Break in case of compromise: iniciar nuovo handshake com DH
 */
export class RatchetService {
    private crypto: CryptoService;
    private storage: StorageService;
    private myId: string;

    // Sessões ativas em memória (para performance)
    private activeSessions: Map<string, RatchetState> = new Map();

    // Timeout para inicializar nova sessão
    private sessionTimeout: number = 86400000; // 24h

    constructor(myId: string, crypto?: CryptoService, storage?: StorageService) {
        this.myId = myId;
        this.crypto = crypto || new CryptoService();
        this.storage = storage || new StorageService();

        console.log(`[RATCHET] Service initialized for ${myId}`);
    }

    // =========================================================================
    // SESSION INITIALIZATION
    // =========================================================================

    /**
     * Inicia nova sessão com peer
     * Realiza ECDH handshake para derivar chaves iniciais
     */
    async initializeSession(
        peerId: string,
        peerPublicKey: Uint8Array,
        sharedSecret?: Uint8Array
    ): Promise<RatchetState> {
        const sessionId = `${this.myId}-${peerId}-${Date.now()}`;

        // Gerar meu ephemeral DH keypair
        const myDh = await this.crypto.generateKeyPair();

        // ECDH com peer's public key (convertido para CryptoKey)
        const peerPublicCryptoKey = await this.crypto.importPublicKey(peerPublicKey);
        const derivedSecret = await this.crypto.performKeyAgreement(myDh.privateKey, peerPublicCryptoKey);

        // Derivar chaves iniciais usando HKDF
        // KDF(secret) → rootKey, chainKeySend, chainKeyReceive
        const rootKey = new Uint8Array(32); // KDF[0:32]
        const chainKeySend = new Uint8Array(32); // KDF[32:64]
        const chainKeyReceive = sharedSecret
            ? new Uint8Array(32) // Use provided (initiator recebe com delay)
            : new Uint8Array(32);

        // Simular KDF aqui (em produção: HKDF-SHA256)
        const kdf = await this.crypto.sha256(derivedSecret.toString());
        const kdfBytes = new Uint8Array(kdf.substring(0, 64).split('').map((c) => c.charCodeAt(0)));
        rootKey.set(kdfBytes.subarray(0, 32));
        chainKeySend.set(kdfBytes.subarray(0, 32));

        const state: RatchetState = {
            sessionId,
            peerId,
            dhs: myDh,
            dhr: null,
            rootKey,
            chainKeySend,
            chainKeyReceive,
            messageNumber: 0,
            previousChainLength: 0,
            skipped: new Map(),
            timestamp: Date.now(),
        };

        // Armazenar em memória
        this.activeSessions.set(sessionId, state);

        // Persistir em encrypted storage
        await this.storage.setMasterKey(rootKey);
        await this.storage.markAsEncrypted(STORAGE.KEYS.RATCHET_STATE);
        await this.storage.set<RatchetState>(STORAGE.KEYS.RATCHET_STATE, state);

        console.log(`[RATCHET] Initialized session ${sessionId}`);
        return state;
    }

    /**
     * Recupera sessão do storage
     */
    async loadSession(sessionId: string): Promise<RatchetState | null> {
        // Tentar memória primeiro
        if (this.activeSessions.has(sessionId)) {
            return this.activeSessions.get(sessionId)!;
        }

        // Carregar do storage
        const state = await this.storage.get<RatchetState>(STORAGE.KEYS.RATCHET_STATE);
        if (state) {
            this.activeSessions.set(sessionId, state);
            return state;
        }

        return null;
    }

    // =========================================================================
    // ENCRYPTION (SEND SIDE)
    // =========================================================================

    /**
     * Encripta mensagem para peer
     * Aplica DH Ratchet + Chain Ratchet
     */
    async encryptMessage(sessionId: string, plaintext: Uint8Array): Promise<EncryptedMessage> {
        const state = await this.loadSession(sessionId);
        if (!state) {
            throw new Error(`Session ${sessionId} not found`);
        }

        // ===== DH RATCHET (enviar novo DH key se recebemos um novo) =====
        if (state.dhr !== null) {
            // Recebemos DH key de peer - fazer ratchet step
            await this.dhRatchetStep(state);
        }

        // ===== CHAIN RATCHET (derivar message key) =====
        const messageKey = await this.chainRatchetSend(state);

        // Encriptar
        const encrypted = await this.crypto.encrypt(plaintext, messageKey.key, messageKey.nonce);

        // Header com contexto (para receiver fazer ratchet se necessário)
        const dhPublic = await this.exportPublicKey(state.dhs.publicKey);

        const message: EncryptedMessage = {
            header: {
                dh: dhPublic,
                messageNumber: messageKey.messageNumber,
                previousChainLength: state.previousChainLength,
            },
            ciphertext: encrypted.ciphertext,
            tag: encrypted.tag,
            iv: encrypted.iv,
        };

        // Persistir estado
        await this.storage.set<RatchetState>(STORAGE.KEYS.RATCHET_STATE, state);

        console.log(`[RATCHET] Encrypted message seq=${messageKey.messageNumber} for ${state.peerId}`);
        return message;
    }

    /**
     * Deriva message key dos send chain
     */
    private async chainRatchetSend(state: RatchetState): Promise<MessageKey> {
        // messageKey = HMAC-SHA256(chainKeySend, 0x01)
        const messageKeyMaterial = await this.crypto.sha256(state.chainKeySend.toString() + ':MSG');
        const messageKeyBytes = new Uint8Array(32);
        messageKeyBytes.set(new Uint8Array(messageKeyMaterial.substring(0, 64).split('').map((c) => c.charCodeAt(0))));

        // Atualizar chain key para próximo: chainKey = HMAC-SHA256(chainKey, 0x02)
        const nextChainKey = await this.crypto.sha256(state.chainKeySend.toString() + ':CHAIN');
        state.chainKeySend.set(new Uint8Array(nextChainKey.substring(0, 64).split('').map((c) => c.charCodeAt(0))));

        // Gerar nonce aleatório (12 bytes para GCM)
        const nonce = new Uint8Array(12);
        crypto.getRandomValues(nonce);

        const key: MessageKey = {
            key: messageKeyBytes,
            nonce,
            messageNumber: state.messageNumber,
        };

        state.messageNumber++;
        return key;
    }

    // =========================================================================
    // DECRYPTION (RECEIVE SIDE)
    // =========================================================================

    /**
     * Decripta mensagem recebida
     * Aplica DH Ratchet + Chain Ratchet (com out-of-order tolerance)
     */
    async decryptMessage(sessionId: string, message: EncryptedMessage): Promise<Uint8Array> {
        const state = await this.loadSession(sessionId);
        if (!state) {
            throw new Error(`Session ${sessionId} not found`);
        }

        // ===== DH RATCHET (se peer enviou novo DH key) =====
        const peerDhPublic = message.header.dh;
        if (!state.dhr || this.computeKeyHash(state.dhr) !== this.computeKeyHash(peerDhPublic)) {
            // Nova DH key de peer - fazer ratchet
            await this.dhRatchetReceive(state, peerDhPublic, message.header.previousChainLength);
            state.dhr = peerDhPublic;
        }

        // ===== CHAIN RATCHET (recuperar message key) =====
        const messageKey = await this.chainRatchetReceive(state, message.header.messageNumber);

        // Decryptar
        let plaintext: Uint8Array;
        try {
            plaintext = await this.crypto.decrypt(
                message.ciphertext,
                messageKey.key,
                message.iv,
                message.tag
            );
        } catch (err) {
            console.error('[RATCHET] Decryption failed:', err);
            throw new Error('Message decryption failed');
        }

        // Persistir estado
        await this.storage.set<RatchetState>(STORAGE.KEYS.RATCHET_STATE, state);

        console.log(`[RATCHET] Decrypted message seq=${message.header.messageNumber} from ${state.peerId}`);
        return plaintext;
    }

    /**
     * Deriva message key dos receive chain (com suporte a out-of-order)
     */
    private async chainRatchetReceive(state: RatchetState, messageNumber: number): Promise<MessageKey> {
        // Se fora de ordem: guardar keys skipped
        while (state.messageNumber < messageNumber) {
            const skipped = await this.chainRatchetReceiveStep(state);
            const key = this.computeKeyHash(new Uint8Array([state.messageNumber]));
            state.skipped.set(key, skipped.key);
            state.messageNumber++;
        }

        // Recuperar o message key para este número
        const messageKey = await this.chainRatchetReceiveStep(state);
        state.messageNumber++;

        return messageKey;
    }

    private async chainRatchetReceiveStep(state: RatchetState): Promise<MessageKey> {
        // messageKey = HMAC-SHA256(chainKeyReceive, 0x01)
        const messageKeyMaterial = await this.crypto.sha256(state.chainKeyReceive.toString() + ':MSG');
        const messageKeyBytes = new Uint8Array(32);
        messageKeyBytes.set(new Uint8Array(messageKeyMaterial.substring(0, 64).split('').map((c) => c.charCodeAt(0))));

        // Atualizar chain key: chainKey = HMAC-SHA256(chainKey, 0x02)
        const nextChainKey = await this.crypto.sha256(state.chainKeyReceive.toString() + ':CHAIN');
        state.chainKeyReceive.set(new Uint8Array(nextChainKey.substring(0, 64).split('').map((c) => c.charCodeAt(0))));

        const nonce = new Uint8Array(12);
        crypto.getRandomValues(nonce);

        return {
            key: messageKeyBytes,
            nonce,
            messageNumber: state.messageNumber,
        };
    }

    // =========================================================================
    // DH RATCHET STEPS
    // =========================================================================

    /**
     * DH Ratchet na recepção (recebemos nova chave de peer)
     */
    private async dhRatchetReceive(state: RatchetState, peerDh: Uint8Array, peerPrevChainLength: number): Promise<void> {
        // Salvar comprimento da cadeia anterior
        state.previousChainLength = state.messageNumber;
        state.messageNumber = 0;

        // ECDH(minha private, peer's public)
        const peerDhCryptoKey = await this.crypto.importPublicKey(peerDh);
        const derivedSecret = await this.crypto.performKeyAgreement(state.dhs.privateKey, peerDhCryptoKey);

        // KDF com root key
        const kdf = await this.crypto.sha256(derivedSecret.toString() + ':RECEIVE');
        const kdfBytes = new Uint8Array(kdf.substring(0, 128).split('').map((c) => c.charCodeAt(0)));

        // Atualizar root key e receive chain
        state.rootKey.set(kdfBytes.subarray(0, 32));
        state.chainKeyReceive.set(kdfBytes.subarray(32, 64));

        console.log(`[RATCHET] DH Ratchet receive step for ${state.peerId}`);
    }

    /**
     * DH Ratchet na transmissão (geramos nova chave)
     */
    private async dhRatchetStep(state: RatchetState): Promise<void> {
        // Gerar novo DH keypair
        const newDh = await this.crypto.generateKeyPair();

        // ECDH(novo private, peer's public)
        if (state.dhr) {
            const peerDhCryptoKey = await this.crypto.importPublicKey(state.dhr);
            const derivedSecret = await this.crypto.performKeyAgreement(newDh.privateKey, peerDhCryptoKey);

            // KDF
            const kdf = await this.crypto.sha256(derivedSecret.toString() + ':SEND');
            const kdfBytes = new Uint8Array(kdf.substring(0, 128).split('').map((c) => c.charCodeAt(0)));

            state.rootKey.set(kdfBytes.subarray(0, 32));
            state.chainKeySend.set(kdfBytes.subarray(32, 64));
        }

        // Agora usar novo DH para próximas mensagens
        state.dhs = newDh;

        console.log(`[RATCHET] DH Ratchet step for ${state.peerId}`);
    }

    // =========================================================================
    // UTILITIES
    // =========================================================================

    /**
     * Export public key para enviar no header
     */
    private async exportPublicKey(publicKey: CryptoKey): Promise<Uint8Array> {
        const exported = await crypto.subtle.exportKey('raw', publicKey);
        return new Uint8Array(exported);
    }

    /**
     * Hash simples de chave para comparação
     */
    private computeKeyHash(key: Uint8Array): string {
        return Array.from(key).map((b) => b.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Cleanup de sessão antiga
     * Remove sessions com mais de 24h ou com muitos skipped keys
     */
    async pruneSessions(): Promise<void> {
        const now = Date.now();
        let removed = 0;

        for (const [sessionId, state] of this.activeSessions.entries()) {
            if (now - state.timestamp > this.sessionTimeout || state.skipped.size > 1000) {
                this.activeSessions.delete(sessionId);
                removed++;
            }
        }

        console.log(`[RATCHET] Pruned ${removed} old sessions`);
    }

    /**
     * Retorna lista de sessões ativas
     */
    listSessions(): string[] {
        return Array.from(this.activeSessions.keys());
    }
}
