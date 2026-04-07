/**
 * AudNova V22.0 - StorageService
 * Persistência segura com AES-256-GCM
 * Baseado na engenharia Aether Elite V10.8.2
 */

import { IStorageService, SecureStorageRecord } from '../types';
import { STORAGE } from '../core/config';
import { CryptoService } from './CryptoService';

/**
 * Serviço de armazenamento com criptografia automática
 * - Persiste em localStorage (web) ou AsyncStorage (React Native)
 * - Criptografa automaticamente valores sensíveis
 * - IMPORTANTE: requer master key via setMasterKey()
 */
export class StorageService implements IStorageService {
    private crypto: CryptoService;
    private masterKey: Uint8Array | null = null;
    private encryptedKeys = new Set<string>();
    private storage: Storage | Map<string, string>; // Fallback para testes

    constructor(cryptoService?: CryptoService) {
        this.crypto = cryptoService || new CryptoService();

        // Detectar ambiente
        try {
            this.storage = typeof localStorage !== 'undefined' ? localStorage : new Map();
        } catch {
            this.storage = new Map();
        }
    }

    // =========================================================================
    // MASTER KEY MANAGEMENT
    // =========================================================================

    /**
     * Define master key para criptografia
     * CRÍTICO: chamar logo no boot com seed
     */
    async setMasterKey(key: Uint8Array): Promise<void> {
        if (key.length !== 32) {
            throw new Error('[STORAGE] Master key must be 32 bytes (AES-256)');
        }
        this.masterKey = key;
        console.log('[STORAGE] Master key set');
    }

    /**
     * Limpa master key da memória (logout)
     */
    clearMasterKey(): void {
        this.masterKey = null;
        this.encryptedKeys.clear();
        console.log('[STORAGE] Master key cleared');
    }

    /**
     * Marca uma chave para ser sempre criptografada
     */
    markAsEncrypted(keys: string[]): void {
        keys.forEach((key) => this.encryptedKeys.add(key));
    }

    // =========================================================================
    // GET & SET OPERATIONS
    // =========================================================================

    /**
     * Recupera valor (descriptografa se necessário)
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const stored = this.getFromStorage(key);
            if (!stored) return null;

            // Verificar se era criptografado
            if (this.encryptedKeys.has(key) && this.masterKey) {
                const record = JSON.parse(stored) as SecureStorageRecord;
                const decrypted = await this.crypto.decrypt(
                    record.value,
                    this.masterKey,
                    record.iv,
                    record.tag
                );
                return JSON.parse(new TextDecoder().decode(decrypted));
            }

            return JSON.parse(stored) as T;
        } catch (error) {
            console.warn(`[STORAGE] Get failed for ${key}: ${error}`);
            return null;
        }
    }

    /**
     * Armazena valor (criptografa se marcado)
     */
    async set<T>(key: string, value: T): Promise<void> {
        try {
            // Se marcado para criptografia e master key disponível
            if (this.encryptedKeys.has(key) && this.masterKey) {
                const data = new TextEncoder().encode(JSON.stringify(value));
                const { ciphertext, iv, tag } = await this.crypto.encrypt(data, this.masterKey);

                const record: SecureStorageRecord = {
                    key,
                    value: ciphertext,
                    salt: new Uint8Array(0), // Não usado neste contexto
                    iv,
                    tag,
                    createdAt: Date.now(),
                };

                this.setInStorage(key, JSON.stringify(record));
            } else {
                this.setInStorage(key, JSON.stringify(value));
            }

            console.log(`[STORAGE] Set ${key} (encrypted: ${this.encryptedKeys.has(key)})`);
        } catch (error) {
            throw new Error(`[STORAGE] Set failed for ${key}: ${error}`);
        }
    }

    /**
     * Deleta chave
     */
    async delete(key: string): Promise<void> {
        this.deleteFromStorage(key);
        console.log(`[STORAGE] Deleted ${key}`);
    }

    /**
     * Limpa todo storage
     */
    async clear(): Promise<void> {
        if (this.storage instanceof Storage) {
            this.storage.clear();
        } else {
            this.storage.clear();
        }
        console.log('[STORAGE] Cleared all');
    }

    // =========================================================================
    // BATCH OPERATIONS
    // =========================================================================

    /**
     * Salva múltiplos valores em batch
     */
    async setMultiple<T extends Record<string, any>>(items: T): Promise<void> {
        const promises = Object.entries(items).map(([key, value]) => this.set(key, value));
        await Promise.all(promises);
    }

    /**
     * Carrega múltiplas chaves
     */
    async getMultiple(keys: string[]): Promise<Record<string, any>> {
        const result: Record<string, any> = {};
        for (const key of keys) {
            result[key] = await this.get(key);
        }
        return result;
    }

    /**
     * Carrega tudo (útil para backups)
     */
    async getAll(): Promise<Record<string, any>> {
        const result: Record<string, any> = {};

        if (this.storage instanceof Storage) {
            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key(i);
                if (key) {
                    result[key] = await this.get(key);
                }
            }
        } else {
            for (const [key] of this.storage.entries()) {
                result[key] = await this.get(key);
            }
        }

        return result;
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    private getFromStorage(key: string): string | null {
        if (this.storage instanceof Storage) {
            return this.storage.getItem(key);
        } else {
            return this.storage.get(key) || null;
        }
    }

    private setInStorage(key: string, value: string): void {
        if (this.storage instanceof Storage) {
            this.storage.setItem(key, value);
        } else {
            this.storage.set(key, value);
        }
    }

    private deleteFromStorage(key: string): void {
        if (this.storage instanceof Storage) {
            this.storage.removeItem(key);
        } else {
            this.storage.delete(key);
        }
    }

    /**
     * Retorna tamanho aproximado em bytes
     */
    getStorageSize(): number {
        let size = 0;
        if (this.storage instanceof Storage) {
            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key(i);
                if (key) {
                    const value = this.storage.getItem(key);
                    size += key.length + (value?.length || 0);
                }
            }
        } else {
            for (const [key, value] of this.storage.entries()) {
                size += key.length + value.length;
            }
        }
        return size;
    }

    /**
     * Drena storage automático por chave regex
     */
    async prune(pattern: RegExp): Promise<number> {
        let deleted = 0;

        if (this.storage instanceof Storage) {
            const keys: string[] = [];
            for (let i = 0; i < this.storage.length; i++) {
                const key = this.storage.key(i);
                if (key && pattern.test(key)) {
                    keys.push(key);
                }
            }
            for (const key of keys) {
                await this.delete(key);
                deleted++;
            }
        } else {
            const keys = Array.from(this.storage.keys()).filter((k) => pattern.test(k));
            for (const key of keys) {
                await this.delete(key);
                deleted++;
            }
        }

        console.log(`[STORAGE] Pruned ${deleted} items matching ${pattern}`);
        return deleted;
    }
}

/**
 * Factory com defaults pre-configurados
 */
export function createStorageService(cryptoService?: CryptoService): StorageService {
    const service = new StorageService(cryptoService);

    // Marcar chaves sensíveis para criptografia automática
    service.markAsEncrypted([
        'auth_seed_v4',
        'auth_account_v4',
        'ratchet_state_v4',
        'session_keys_v4',
        'key_cache_v4',
        'hyper_wallet_v4',
    ]);

    return service;
}

/**
 * Export singleton
 */
export const storageService = createStorageService();
