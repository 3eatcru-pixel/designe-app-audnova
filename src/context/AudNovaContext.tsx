/**
 * AudNova V22.0 - Context Provider
 * Global context para todos os serviços Aether
 * Evita prop drilling e fornece acesso simples via useAudNova hook
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AudNovaNode } from '../__tests__/example-integration';
import { RadioService } from '../services/RadioService';
import { MessageService } from '../services/MessageService';
import { RatchetService } from '../services/RatchetService';
import { IdentityService } from '../services/IdentityService';
import { CryptoService } from '../services/CryptoService';
import { StorageService } from '../services/StorageService';

/**
 * Tipo para o contexto AudNova
 */
export interface AudNovaContextType {
    // Node principal
    node: AudNovaNode | null;

    // Serviços individuais (para acesso direto)
    radioService: RadioService | null;
    messageService: MessageService | null;
    ratchetService: RatchetService | null;
    identityService: IdentityService | null;
    cryptoService: CryptoService | null;
    storageService: StorageService | null;

    // Estado
    status: 'initializing' | 'bootstrapping' | 'connecting' | 'ready' | 'error';
    error: string | null;
    isInitialized: boolean;
    userId: string | null;
    userSeed: string | null;

    // Ações
    bootstrapNewIdentity: () => Promise<{ mnemonic: string }>;
    bootstrapFromSeed: (mnemonic: string) => Promise<boolean>;
    connectToMesh: (peers: AudNovaNode[]) => Promise<void>;
    logout: () => Promise<void>;
}

/**
 * Criar context
 */
const AudNovaContext = createContext<AudNovaContextType | undefined>(undefined);

/**
 * Provider component
 */
export interface AudNovaProviderProps {
    children: ReactNode;
}

export function AudNovaProvider({ children }: AudNovaProviderProps) {
    const [node, setNode] = useState<AudNovaNode | null>(null);
    const [status, setStatus] = useState<'initializing' | 'bootstrapping' | 'connecting' | 'ready' | 'error'>(
        'initializing'
    );
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userSeed, setUserSeed] = useState<string | null>(null);

    // Initialize node on mount
    useEffect(() => {
        const initializeNode = async () => {
            try {
                setStatus('initializing');

                // Criar novo node (TBD: usar userId do localStorage/auth)
                const newNode = new AudNovaNode('audnova-user-' + Date.now());
                setNode(newNode);
                setUserId(newNode.nodeId);

                console.log('[CONTEXT] Node initialized:', newNode.nodeId);
                setStatus('ready');
            } catch (err) {
                console.error('[CONTEXT] Initialization failed:', err);
                setStatus('error');
                setError(err instanceof Error ? err.message : 'Unknown error');
            }
        };

        initializeNode();
    }, []);

    // Bootstrap new identity
    const bootstrapNewIdentity = async (): Promise<{ mnemonic: string }> => {
        if (!node) {
            throw new Error('Node not initialized');
        }

        try {
            setStatus('bootstrapping');
            const identity = await node.bootstrapNewIdentity();
            setUserSeed(identity.mnemonic);
            setStatus('ready');
            console.log('[CONTEXT] New identity bootstrapped');
            return identity;
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Bootstrap failed';
            setError(errMsg);
            setStatus('error');
            throw err;
        }
    };

    // Bootstrap from existing seed
    const bootstrapFromSeed = async (mnemonic: string): Promise<boolean> => {
        if (!node) {
            throw new Error('Node not initialized');
        }

        try {
            setStatus('bootstrapping');
            await node.bootstrapFromSeed(mnemonic);
            setUserSeed(mnemonic);
            setStatus('ready');
            console.log('[CONTEXT] Identity restored from seed');
            return true;
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Bootstrap from seed failed';
            setError(errMsg);
            setStatus('error');
            return false;
        }
    };

    // Connect to mesh
    const connectToMesh = async (peers: AudNovaNode[] = []): Promise<void> => {
        if (!node) {
            throw new Error('Node not initialized');
        }

        try {
            setStatus('connecting');
            await node.connectToMesh(peers);
            console.log('[CONTEXT] Connected to mesh with', peers.length, 'peers');
            setStatus('ready');
        } catch (err) {
            const errMsg = err instanceof Error ? err.message : 'Mesh connection failed';
            setError(errMsg);
            setStatus('error');
            throw err;
        }
    };

    // Logout
    const logout = async (): Promise<void> => {
        if (!node) {
            return;
        }

        try {
            await node.shutdown();
            setNode(null);
            setUserId(null);
            setUserSeed(null);
            setStatus('initializing');
            console.log('[CONTEXT] Logged out');
        } catch (err) {
            console.error('[CONTEXT] Logout error:', err);
        }
    };

    const value: AudNovaContextType = {
        node,
        radioService: node ? (node as any).radioService : null,
        messageService: node ? (node as any).messageService : null,
        ratchetService: node ? (node as any).ratchetService : null,
        identityService: node ? (node as any).identityService : null,
        cryptoService: node ? (node as any).crypto : null,
        storageService: node ? (node as any).storage : null,
        status,
        error,
        isInitialized: status === 'ready',
        userId,
        userSeed,
        bootstrapNewIdentity,
        bootstrapFromSeed,
        connectToMesh,
        logout,
    };

    return <AudNovaContext.Provider value={value}>{children}</AudNovaContext.Provider>;
}

/**
 * Hook para acessar o contexto AudNova
 */
export function useAudNova(): AudNovaContextType {
    const context = useContext(AudNovaContext);
    if (context === undefined) {
        throw new Error('useAudNova must be used within AudNovaProvider');
    }
    return context;
}

/**
 * Hook para acessar apenas um serviço específico
 */
export function useRadioService(): RadioService | null {
    const { radioService } = useAudNova();
    return radioService;
}

export function useMessageService(): MessageService | null {
    const { messageService } = useAudNova();
    return messageService;
}

export function useRatchetService(): RatchetService | null {
    const { ratchetService } = useAudNova();
    return ratchetService;
}

export function useIdentityService(): IdentityService | null {
    const { identityService } = useAudNova();
    return identityService;
}

export function useCryptoService(): CryptoService | null {
    const { cryptoService } = useAudNova();
    return cryptoService;
}

export function useStorageService(): StorageService | null {
    const { storageService } = useAudNova();
    return storageService;
}

export default AudNovaContext;
