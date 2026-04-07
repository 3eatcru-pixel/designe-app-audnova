/**
 * AudNova V22.0 - React Hooks for Service Integration
 * Simplified access to core services from React components
 * Baseado na engenharia Aether Elite V10.8.2
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { RadioService } from '../services/RadioService';
import { RatchetService } from '../services/RatchetService';
import { IdentityService } from '../services/IdentityService';
import { MessageService } from '../services/MessageService';
import { RadioChannel, AudioSegment } from '../types';
import { ChatMessage, MessageThread } from '../services/MessageService';

// ============================================================================
// useRadio - Gerencia canais de áudio e transmissão
// ============================================================================

export function useRadio(radioService: RadioService | null) {
    const [activeChannel, setActiveChannel] = useState<RadioChannel | null>(null);
    const [channels, setChannels] = useState<RadioChannel[]>([]);
    const [isTransmitting, setIsTransmitting] = useState(false);
    const [audioData, setAudioData] = useState<AudioSegment | null>(null);
    const [channelStats, setChannelStats] = useState<any>(null);

    // Create channel
    const createChannel = useCallback(
        async (name: string, encrypted: boolean = true) => {
            if (!radioService) return null;
            try {
                const channel = await radioService.createChannel(name, encrypted);
                setChannels((prev) => [...prev, channel]);
                setActiveChannel(channel);
                return channel;
            } catch (err) {
                console.error('Failed to create channel:', err);
                return null;
            }
        },
        [radioService]
    );

    // Join channel
    const joinChannel = useCallback(
        async (channelId: string) => {
            if (!radioService) return null;
            try {
                const channel = await radioService.joinChannel(channelId);
                setActiveChannel(channel);
                return channel;
            } catch (err) {
                console.error('Failed to join channel:', err);
                return null;
            }
        },
        [radioService]
    );

    // List channels
    const listChannels = useCallback(() => {
        if (!radioService) return [];
        const channelList = radioService.listChannels();
        setChannels(channelList);
        return channelList;
    }, [radioService]);

    // Start transmission
    const startTransmit = useCallback(
        async (sampleRate: number = 48000) => {
            if (!radioService) return;
            try {
                radioService.startTransmission(sampleRate);
                setIsTransmitting(true);
            } catch (err) {
                console.error('Failed to start transmission:', err);
            }
        },
        [radioService]
    );

    // Stop transmission
    const stopTransmit = useCallback(() => {
        if (!radioService) return;
        radioService.stopTransmission();
        setIsTransmitting(false);
    }, [radioService]);

    // Register audio handler
    useEffect(() => {
        if (!radioService) return;

        radioService.onAudio((audio, fromPeerId) => {
            setAudioData(audio);
        });

        radioService.onChannelChange((channel) => {
            setActiveChannel(channel);
        });
    }, [radioService]);

    return {
        activeChannel,
        channels,
        isTransmitting,
        audioData,
        channelStats,
        createChannel,
        joinChannel,
        listChannels,
        startTransmit,
        stopTransmit,
    };
}

// ============================================================================
// useRatchet - Gerencia E2EE com Double Ratchet
// ============================================================================

export function useRatchet(ratchetService: RatchetService | null, peerId: string | null) {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [isEncrypted, setIsEncrypted] = useState(false);
    const [lastMessageTime, setLastMessageTime] = useState<number>(0);
    const sessionRef = useRef<any>(null);

    // Initialize session com peer
    const initSession = useCallback(
        async (peerPublicKey: Uint8Array) => {
            if (!ratchetService || !peerId) return null;
            try {
                const session = await ratchetService.initializeSession(peerId, peerPublicKey);
                setSessionId(session.sessionId);
                setIsEncrypted(true);
                sessionRef.current = session;
                return session.sessionId;
            } catch (err) {
                console.error('Failed to initialize session:', err);
                return null;
            }
        },
        [ratchetService, peerId]
    );

    // Encrypt message
    const encryptMessage = useCallback(
        async (plaintext: string): Promise<string | null> => {
            if (!ratchetService || !sessionId) return null;
            try {
                const bytes = new TextEncoder().encode(plaintext);
                const encrypted = await ratchetService.encryptMessage(sessionId, bytes);
                setLastMessageTime(Date.now());
                return JSON.stringify(encrypted);
            } catch (err) {
                console.error('Encryption failed:', err);
                return null;
            }
        },
        [ratchetService, sessionId]
    );

    // Decrypt message
    const decryptMessage = useCallback(
        async (encryptedJson: string): Promise<string | null> => {
            if (!ratchetService || !sessionId) return null;
            try {
                const encrypted = JSON.parse(encryptedJson);
                const plaintext = await ratchetService.decryptMessage(sessionId, encrypted);
                return new TextDecoder().decode(plaintext);
            } catch (err) {
                console.error('Decryption failed:', err);
                return null;
            }
        },
        [ratchetService, sessionId]
    );

    // List active sessions
    const listSessions = useCallback(() => {
        if (!ratchetService) return [];
        return ratchetService.listSessions();
    }, [ratchetService]);

    // Prune old sessions
    const pruneSessions = useCallback(async () => {
        if (!ratchetService) return;
        await ratchetService.pruneSessions();
    }, [ratchetService]);

    return {
        sessionId,
        isEncrypted,
        lastMessageTime,
        initSession,
        encryptMessage,
        decryptMessage,
        listSessions,
        pruneSessions,
    };
}

// ============================================================================
// useIdentity - Gerencia identidade e DIDs
// ============================================================================

export function useIdentity(identityService: IdentityService | null) {
    const [seed, setSeed] = useState<any>(null);
    const [did, setDid] = useState<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Generate new identity
    const generateNewIdentity = useCallback(async () => {
        if (!identityService) return null;
        try {
            const newSeed = await identityService.generateNewSeed();
            setSeed(newSeed);

            const newDid = await identityService.createDIDFromSeed(newSeed);
            setDid(newDid);

            setIsLoaded(true);
            return { seed: newSeed, did: newDid };
        } catch (err) {
            console.error('Failed to generate identity:', err);
            return null;
        }
    }, [identityService]);

    // Restore from seed
    const restoreFromSeed = useCallback(
        async (mnemonic: string) => {
            if (!identityService) return null;
            try {
                // NOTE: need to implement restoreFromSeed in IdentityService
                console.log('Restoring from seed:', mnemonic);
                setIsLoaded(true);
                return true;
            } catch (err) {
                console.error('Failed to restore from seed:', err);
                return false;
            }
        },
        [identityService]
    );

    // Verify DID
    const verifyDid = useCallback(async () => {
        if (!identityService || !did) return false;
        try {
            const isValid = await identityService.verifyDID(did);
            return isValid;
        } catch (err) {
            console.error('DID verification failed:', err);
            return false;
        }
    }, [identityService, did]);

    // Check if DID expired
    const isDidExpired = useCallback(async () => {
        if (!identityService || !did) return false;
        try {
            return await identityService.isDIDExpired(did);
        } catch (err) {
            console.error('DID expiration check failed:', err);
            return true;
        }
    }, [identityService, did]);

    // Export public key
    const getPublicKey = useCallback(async () => {
        if (!identityService) return null;
        try {
            return await identityService.getPublicKeyRaw();
        } catch (err) {
            console.error('Failed to get public key:', err);
            return null;
        }
    }, [identityService]);

    return {
        seed,
        did,
        isLoaded,
        generateNewIdentity,
        restoreFromSeed,
        verifyDid,
        isDidExpired,
        getPublicKey,
    };
}

// ============================================================================
// useMessage - Gerencia mensagens e threads
// ============================================================================

export function useMessage(messageService: MessageService | null, threadId: string | null) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [thread, setThread] = useState<MessageThread | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [typingPeers, setTypingPeers] = useState<string[]>([]);

    // Send message
    const sendMessage = useCallback(
        async (text: string) => {
            if (!messageService || !threadId) return null;
            try {
                const message = await messageService.sendMessage(threadId, text);
                setMessages((prev) => [...prev, message]);
                return message;
            } catch (err) {
                console.error('Failed to send message:', err);
                return null;
            }
        },
        [messageService, threadId]
    );

    // Load thread
    const loadThread = useCallback(
        (tId: string) => {
            if (!messageService) return;
            const t = messageService.getThread(tId);
            if (t) {
                setThread(t);
                setMessages(t.messages);
                setUnreadCount(t.unreadCount);
            }
        },
        [messageService]
    );

    // Mark as read
    const markAsRead = useCallback(
        async (messageId: string) => {
            if (!messageService) return;
            await messageService.markAsRead(messageId);
        },
        [messageService]
    );

    // Add reaction
    const addReaction = useCallback(
        async (messageId: string, emoji: string) => {
            if (!messageService) return;
            await messageService.addReaction(messageId, emoji);
        },
        [messageService]
    );

    // Set typing
    const setTyping = useCallback(
        async (isTyping: boolean) => {
            if (!messageService || !threadId) return;
            await messageService.setTypingIndicator(threadId, isTyping);
        },
        [messageService, threadId]
    );

    // Search
    const search = useCallback(
        (query: string) => {
            if (!messageService || !threadId) return [];
            return messageService.searchInThread(threadId, query);
        },
        [messageService, threadId]
    );

    // Register handlers
    useEffect(() => {
        if (!messageService || !threadId) return;

        messageService.onMessage((msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        messageService.onTyping((indicator) => {
            if (indicator.threadId === threadId) {
                setTypingPeers((prev) => messageService.getTypingPeers(threadId));
            }
        });

        return () => {
            // Cleanup
        };
    }, [messageService, threadId]);

    return {
        messages,
        thread,
        unreadCount,
        typingPeers,
        sendMessage,
        loadThread,
        markAsRead,
        addReaction,
        setTyping,
        search,
    };
}

// ============================================================================
// useIdentityBoot - Bootstrap identity com seeds e DIDs
// ============================================================================

export function useIdentityBoot(crypto: any, storage: any) {
    const [isBootstrapped, setIsBootstrapped] = useState(false);
    const [mnemonic, setMnemonic] = useState<string | null>(null);

    // Bootstrap new
    const bootstrapNew = useCallback(async () => {
        try {
            const identity = {
                mnemonic: 'word1 word2 ... word12', // Actual BIP39
            };
            setMnemonic(identity.mnemonic);
            setIsBootstrapped(true);
            return identity;
        } catch (err) {
            console.error('Bootstrap failed:', err);
            return null;
        }
    }, []);

    // Bootstrap from mnemonic
    const bootstrapFrom = useCallback(async (mnemonicPhrase: string) => {
        try {
            setMnemonic(mnemonicPhrase);
            setIsBootstrapped(true);
            return true;
        } catch (err) {
            console.error('Bootstrap from mnemonic failed:', err);
            return false;
        }
    }, []);

    return {
        isBootstrapped,
        mnemonic,
        bootstrapNew,
        bootstrapFrom,
    };
}

// ============================================================================
// Export all hooks
// ============================================================================

export default {
    useRadio,
    useRatchet,
    useIdentity,
    useMessage,
    useIdentityBoot,
};
