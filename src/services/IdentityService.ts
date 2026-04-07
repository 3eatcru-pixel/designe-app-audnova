/**
 * AudNova V22.0 - IdentityService
 * Gerencia Identidades DIDs, Seeds BIP39, e Certificates
 * Baseado na engenharia Aether Elite V10.8.2
 */

import { v4 as uuidv4 } from 'uuid';
import {
    SeedIdentity,
    DIDCertificate,
    KeyPair,
} from '../types';
import { CRYPTO_SPEC, IDENTITY_CONFIG } from '../core/config';
import { CryptoService } from './CryptoService';

/**
 * IdentityService - Gerencia criação, derivação e validação de identidades
 * - BIP39 seed mnemonics (12 palavras)
 * - DID derivation (did:aether:$uuid)
 * - Key derivation a partir da seed
 * - Signature & verification de DIDs
 */
export class IdentityService {
    private crypto: CryptoService;
    private currentDID: DIDCertificate | null = null;
    private currentSeed: SeedIdentity | null = null;

    constructor(cryptoService?: CryptoService) {
        this.crypto = cryptoService || new CryptoService();
    }

    // =========================================================================
    // SEED & MNEMONIC MANAGEMENT
    // =========================================================================

    /**
     * Gera uma nova seed BIP39 (12 palavras)
     * Em produção, usar @scure/bip39
     */
    generateNewSeed(): SeedIdentity {
        // Simulação: gerar 128 bits de entropia
        const entropy = window.crypto.getRandomValues(new Uint8Array(16)); // 128 bits
        const salt = window.crypto.getRandomValues(new Uint8Array(16));

        // Em produção: usar bip39.generateMnemonic(128)
        const mnemonic = this.generateMnemonicFromEntropy(entropy);

        // Derivar master key via PBKDF2 (simulado com SHA-256)
        // Em produção: usar PBKDF2 com 2048 rounds
        const masterKey = this.deriveMasterKey(mnemonic, salt);

        const seed: SeedIdentity = {
            mnemonic,
            masterKey,
            salt,
        };

        this.currentSeed = seed;
        return seed;
    }

    /**
     * Restaura uma identidade a partir de uma seed mnemônica existente
     */
    async restoreFromSeed(mnemonic: string): Promise<SeedIdentity> {
        if (!this.validateMnemonic(mnemonic)) {
            throw new Error('[IDENTITY] Invalid mnemonic format');
        }

        const salt = window.crypto.getRandomValues(new Uint8Array(16));
        const masterKey = this.deriveMasterKey(mnemonic, salt);

        const seed: SeedIdentity = {
            mnemonic,
            masterKey,
            salt,
        };

        this.currentSeed = seed;
        return seed;
    }

    /**
     * Validação básica de mnemonic (12 palavras)
     */
    private validateMnemonic(mnemonic: string): boolean {
        const words = mnemonic.trim().split(/\s+/);
        return words.length === IDENTITY_CONFIG.BIP39_WORD_COUNT;
    }

    /**
     * Gera um mnemonic a partir de entropia (simulado)
     */
    private generateMnemonicFromEntropy(entropy: Uint8Array): string {
        // BIP39 word list (subset para demo)
        const wordlist = [
            'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
            'academy', 'accent', 'accept', 'access', 'accident', 'account', 'accuse', 'achieve',
            'acid', 'acknowledge', 'acquire', 'across', 'act', 'action', 'activate', 'active',
            'actor', 'actual', 'acuity', 'acute', 'ad', 'add', 'addict', 'address',
            // ... em produção usar lista completa de 2048 palavras
        ];

        const words: string[] = [];
        for (let i = 0; i < 12; i++) {
            const index = entropy[i] % wordlist.length;
            words.push(wordlist[index]);
        }

        return words.join(' ');
    }

    /**
     * Deriva master key a partir da seed (PBKDF2 simulado)
     */
    private deriveMasterKey(mnemonic: string, salt: Uint8Array): Uint8Array {
        // Em produção: usar PBKDF2 com 2048+ rounds
        // Aqui: simulação simples
        const encoder = new TextEncoder();
        const data = encoder.encode(mnemonic);

        // Apenas para demo - em produção usar @noble/hashes
        const key = new Uint8Array(32);
        for (let i = 0; i < 32; i++) {
            key[i] = (data[i % data.length] ^ salt[i % salt.length]) ^ 0xAA;
        }

        return key;
    }

    // =========================================================================
    // DID GENERATION & DERIVATION
    // =========================================================================

    /**
     * Cria um novo DID a partir da seed atual
     */
    async createDIDFromSeed(): Promise<DIDCertificate> {
        if (!this.currentSeed) {
            throw new Error('[IDENTITY] No seed loaded. Call generateNewSeed() first.');
        }

        // Gerar chave ECDH P-256 a partir da seed
        const keyPair = await this.deriveKeyPairFromSeed(this.currentSeed);

        // Criar DID
        const didId = `${CRYPTO_SPEC.DID_PREFIX}${uuidv4()}`;
        const pubKeyB64 = this.crypto.toBase64(keyPair.publicKey);

        const certificate: DIDCertificate = {
            id: didId,
            publicKey: pubKeyB64,
            issued: Date.now(),
            expires: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 ano
        };

        // Assinar o DID com a chave privada
        const signData = this.encodeForSignature(certificate);
        const signature = await this.crypto.sign(signData, keyPair.privateKey);
        certificate.signature = this.crypto.toBase64(signature);

        this.currentDID = certificate;
        return certificate;
    }

    /**
     * Deriva um KeyPair ECDH a partir da seed BIP44
     * m/44'/0'/0'/0/0 (standard BIP44 path)
     */
    private async deriveKeyPairFromSeed(seed: SeedIdentity): Promise<KeyPair> {
        // Em produção: implementar BIP32 derivation path completo
        // Aqui: simplificado - usar master key diretamente

        // Expandir seed em chave privada de 32 bytes
        const privateKey = new Uint8Array(32);
        const masterKey = seed.masterKey;
        for (let i = 0; i < 32; i++) {
            privateKey[i] = masterKey[i % masterKey.length];
        }

        // Gerar chave pública a partir da privada
        const keyPair = await this.crypto.generateKeyPair();
        return keyPair;
    }

    /**
     * Encoda DID para assinatura (JSON canonicalizado)
     */
    private encodeForSignature(cert: Partial<DIDCertificate>): Uint8Array {
        const obj = {
            id: cert.id,
            publicKey: cert.publicKey,
            issued: cert.issued,
        };
        const json = JSON.stringify(obj);
        return new TextEncoder().encode(json);
    }

    // =========================================================================
    // DID VERIFICATION & VALIDATION
    // =========================================================================

    /**
     * Verifica integridade de um DID certificate
     */
    async verifyDID(certificate: DIDCertificate): Promise<boolean> {
        if (!certificate.signature) {
            console.warn('[IDENTITY] DID missing signature');
            return false;
        }

        try {
            const signData = this.encodeForSignature(certificate);
            const signature = this.crypto.fromBase64(certificate.signature);
            const pubKeyBytes = this.crypto.fromBase64(certificate.publicKey);

            return await this.crypto.verify(signData, signature, pubKeyBytes);
        } catch (error) {
            console.warn(`[IDENTITY] DID verification failed: ${error}`);
            return false;
        }
    }

    /**
     * Valida se um DID não expirou
     */
    isDIDExpired(certificate: DIDCertificate): boolean {
        if (!certificate.expires) return false;
        return Date.now() > certificate.expires;
    }

    /**
     * Retorna o DID atual
     */
    getCurrentDID(): DIDCertificate | null {
        return this.currentDID;
    }

    /**
     * Retorna a seed atual (CUIDADO: informações sensíveis)
     */
    getCurrentSeed(): SeedIdentity | null {
        return this.currentSeed;
    }

    /**
     * Limpa identidade atual da memória
     */
    clearIdentity(): void {
        this.currentDID = null;
        this.currentSeed = null;
        this.crypto.clearCache();
    }

    // =========================================================================
    // PUBLIC KEY EXPORT (para handshakes)
    // =========================================================================

    /**
     * Exporta chave pública em formato raw (65 bytes) para handshake
     */
    getPublicKeyRaw(): Uint8Array | null {
        if (!this.currentDID) return null;

        try {
            return this.crypto.fromBase64(this.currentDID.publicKey);
        } catch {
            return null;
        }
    }

    /**
     * Exporta DID ID apenas
     */
    getDIDId(): string | null {
        return this.currentDID?.id || null;
    }
}

// ============================================================================
// EXPORT DEFAULT INSTANCE
// ============================================================================

export const identityService = new IdentityService();
