/**
 * AudNova V22.0 - CryptoService
 * Implementação de ECDH (handshake), ECDSA (signatures) e AES-GCM (encryption)
 * Baseado na engenharia Aether Elite V10.8.2
 */

import { KeyPair, SessionKeyState, DIDCertificate } from '../types';
import { CRYPTO_SPEC } from '../core/config';

/**
 * Serviço centralizado de criptografia
 * - ECDH P-256 para handshakes e key agreement
 * - ECDSA secp256k1 para signatures
 * - AES-256-GCM para criptografia de payloads
 */
export class CryptoService {
    private keyCache: Map<string, KeyPair> = new Map();

    // =========================================================================
    // KEY GENERATION & MANAGEMENT
    // =========================================================================

    /**
     * Gera um novo par de chaves ECDH P-256
     * Usado para identidade e handshakes
     */
    async generateKeyPair(): Promise<KeyPair> {
        try {
            // WebCrypto API - ECDH P-256
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: 'ECDH',
                    namedCurve: 'P-256',
                },
                true, // extractable
                ['deriveKey', 'deriveBits']
            );

            const pubKeyData = await window.crypto.subtle.exportKey('raw', keyPair.publicKey);
            const privKeyData = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

            return {
                publicKey: new Uint8Array(pubKeyData),
                privateKey: new Uint8Array(privKeyData),
            };
        } catch (error) {
            throw new Error(`[CRYPTO] Failed to generate key pair: ${error}`);
        }
    }

    /**
     * Importa uma chave pública ECDH (raw format, 65 bytes)
     */
    async importPublicKey(publicKeyBytes: Uint8Array): Promise<CryptoKey> {
        try {
            return await window.crypto.subtle.importKey(
                'raw',
                publicKeyBytes,
                {
                    name: 'ECDH',
                    namedCurve: 'P-256',
                },
                false, // not extractable
                []
            );
        } catch (error) {
            throw new Error(`[CRYPTO] Failed to import public key: ${error}`);
        }
    }

    /**
     * Importa uma chave privada ECDH (PKCS8 format)
     */
    async importPrivateKey(privateKeyBytes: Uint8Array): Promise<CryptoKey> {
        try {
            return await window.crypto.subtle.importKey(
                'pkcs8',
                privateKeyBytes,
                {
                    name: 'ECDH',
                    namedCurve: 'P-256',
                },
                true, // extractable
                ['deriveKey', 'deriveBits']
            );
        } catch (error) {
            throw new Error(`[CRYPTO] Failed to import private key: ${error}`);
        }
    }

    // =========================================================================
    // ECDH HANDSHAKE (Key Agreement)
    // =========================================================================

    /**
     * Realiza ECDH para obter uma chave simétrica compartilhada
     * @param myPrivateKeyBytes - Minha chave privada ECDH
     * @param theirPublicKeyBytes - Chave pública do peer (65 bytes)
     * @returns Chave compartilhada (AES-256)
     */
    async performKeyAgreement(
        myPrivateKeyBytes: Uint8Array,
        theirPublicKeyBytes: Uint8Array
    ): Promise<Uint8Array> {
        try {
            const myPrivateKey = await this.importPrivateKey(myPrivateKeyBytes);
            const theirPublicKey = await this.importPublicKey(theirPublicKeyBytes);

            // Derive 32 bytes for AES-256
            const sharedSecret = await window.crypto.subtle.deriveBits(
                {
                    name: 'ECDH',
                    public: theirPublicKey,
                },
                myPrivateKey,
                256 // 32 bytes = 256 bits
            );

            return new Uint8Array(sharedSecret);
        } catch (error) {
            throw new Error(`[CRYPTO] ECDH key agreement failed: ${error}`);
        }
    }

    // =========================================================================
    // SIGNATURES (ECDSA - secp256k1 simulation with ECDSA P-256)
    // =========================================================================

    /**
     * Assina um payload com chave privada ECDSA
     * Nota: WebCrypto não suporta secp256k1 nativamente
     * Em produção, usar biblioteca como @noble/secp256k1
     */
    async sign(data: Uint8Array, privateKeyBytes: Uint8Array): Promise<Uint8Array> {
        try {
            const privateKey = await this.importPrivateKey(privateKeyBytes);

            const signature = await window.crypto.subtle.sign(
                {
                    name: 'ECDSA',
                    hash: 'SHA-256',
                },
                privateKey,
                data
            );

            return new Uint8Array(signature);
        } catch (error) {
            throw new Error(`[CRYPTO] Signature failed: ${error}`);
        }
    }

    /**
     * Verifica assinatura ECDSA contra chave pública
     */
    async verify(
        data: Uint8Array,
        signature: Uint8Array,
        publicKeyBytes: Uint8Array
    ): Promise<boolean> {
        try {
            const publicKey = await this.importPublicKey(publicKeyBytes);

            return await window.crypto.subtle.verify(
                {
                    name: 'ECDSA',
                    hash: 'SHA-256',
                },
                publicKey,
                signature,
                data
            );
        } catch (error) {
            console.warn(`[CRYPTO] Signature verification failed: ${error}`);
            return false;
        }
    }

    // =========================================================================
    // AES-256-GCM ENCRYPTION/DECRYPTION
    // =========================================================================

    /**
     * Criptografa data com AES-256-GCM
     * @param data - Dados a criptografar
     * @param key - Chave AES-256 (32 bytes)
     * @returns { ciphertext, iv, tag } - iv (12 bytes), tag (16 bytes)
     */
    async encrypt(
        data: Uint8Array,
        key: Uint8Array
    ): Promise<{ ciphertext: Uint8Array; iv: Uint8Array; tag: Uint8Array }> {
        try {
            // IV aleatório de 12 bytes
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            // Importer chave AES-256
            const aesKey = await window.crypto.subtle.importKey(
                'raw',
                key,
                {
                    name: 'AES-GCM',
                },
                false,
                ['encrypt']
            );

            // Encrypt com GCM (tag incluída)
            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv,
                },
                aesKey,
                data
            );

            // WebCrypto retorna ciphertext + tag juntos
            // Precisamos separar: últimos 16 bytes são o tag
            const encrypted_array = new Uint8Array(encrypted);
            const ciphertext = encrypted_array.slice(0, encrypted_array.length - 16);
            const tag = encrypted_array.slice(encrypted_array.length - 16);

            return { ciphertext, iv, tag };
        } catch (error) {
            throw new Error(`[CRYPTO] Encryption failed: ${error}`);
        }
    }

    /**
     * Descriptografa data criptografada com AES-256-GCM
     */
    async decrypt(
        ciphertext: Uint8Array,
        key: Uint8Array,
        iv: Uint8Array,
        tag: Uint8Array
    ): Promise<Uint8Array> {
        try {
            // Combinar ciphertext + tag (como WebCrypto espera)
            const encrypted = new Uint8Array(ciphertext.length + tag.length);
            encrypted.set(ciphertext, 0);
            encrypted.set(tag, ciphertext.length);

            // Importar chave
            const aesKey = await window.crypto.subtle.importKey(
                'raw',
                key,
                {
                    name: 'AES-GCM',
                },
                false,
                ['decrypt']
            );

            // Decrypt
            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv: iv,
                },
                aesKey,
                encrypted
            );

            return new Uint8Array(decrypted);
        } catch (error) {
            throw new Error(`[CRYPTO] Decryption failed: ${error}`);
        }
    }

    // =========================================================================
    // UTILITY HELPERS
    // =========================================================================

    /**
     * Converte Uint8Array para base64
     */
    toBase64(data: Uint8Array): string {
        const binary = String.fromCharCode.apply(null, Array.from(data));
        return btoa(binary);
    }

    /**
     * Converte base64 para Uint8Array
     */
    fromBase64(base64: string): Uint8Array {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Hash SHA-256 para deduplicação
     */
    async sha256(data: Uint8Array): Promise<Uint8Array> {
        try {
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
            return new Uint8Array(hashBuffer);
        } catch (error) {
            throw new Error(`[CRYPTO] SHA-256 hash failed: ${error}`);
        }
    }

    /**
     * Limpa cache de chaves (para segurança)
     */
    clearCache(): void {
        this.keyCache.clear();
    }
}

// ============================================================================
// EXPORT DEFAULT INSTANCE
// ============================================================================

export const cryptoService = new CryptoService();
