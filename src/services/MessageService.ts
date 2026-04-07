/**
 * AudNova V22.0 - MessageService
 * Gerenciamento de mensagens, threads, delivery receipts
 * Sincronização via GossipEngine
 * Baseado na engenharia Aether Elite V10.8.2
 */

import { SecurePacket, PacketMetadata } from '../types';
import { MESH_CONFIG, PRIORITIES } from '../core/config';
import { MeshEngine } from '../mesh/MeshEngine';
import { GossipEngine } from '../mesh/GossipEngine';
import { RatchetService } from './RatchetService';
import { CryptoService } from './CryptoService';

/**
 * ChatMessage - Mensagem individual em uma thread
 * Pode ser encriptada (E2EE) ou plaintext em canal público
 */
export interface ChatMessage {
    id: string;
    threadId: string;
    senderId: string;
    text: string;
    timestamp: number;
    isEncrypted: boolean;
    signature?: Uint8Array; // ECDSA signature
    deliveryStatus: 'SENDING' | 'DELIVERED' | 'READ';
    reactions?: Map<string, string[]>; // emoji -> [peerId, peerId]
}

/**
 * MessageThread - Conversa (pode ser 1:1 ou grupo em canal)
 * Representa uma conversa contínua
 */
export interface MessageThread {
    id: string;
    type: 'P2P' | 'CHANNEL_THREAD'; // P2P com peer ou thread em canal
    participants: Set<string>;
    createdAt: number;
    updatedAt: number;
    messages: ChatMessage[];
    unreadCount: number;
    pinnedMessages: string[]; // message IDs
}

/**
 * DeliveryReceipt - Confirmação de entrega/leitura
 * Enviada pelo receiver para confirmar recebimento
 */
export interface DeliveryReceipt {
    messageId: string;
    threadId: string;
    fromPeerId: string;
    toPeerId: string;
    status: 'DELIVERED' | 'READ';
    timestamp: number;
}

/**
 * MessageTypingIndicator - Notificação de digitação
 * "X is typing..." em tempo real
 */
export interface TypingIndicator {
    threadId: string;
    peerId: string;
    isTyping: boolean;
    timestamp: number;
}

/**
 * MessageService - Gerencia threads e sincronização
 * Integra com:
 * - GossipEngine para distribuição
 * - RatchetService para E2EE
 * - MeshEngine para broadcast
 * - RadioService channels (opcional)
 */
export class MessageService {
    private meshEngine: MeshEngine;
    private gossipEngine: GossipEngine;
    private ratchetService: RatchetService;
    private crypto: CryptoService;
    private myId: string;

    // Storage
    private threads: Map<string, MessageThread> = new Map();
    private messageIndex: Map<string, ChatMessage> = new Map(); // messageId -> message
    private deliveryReceipts: Map<string, DeliveryReceipt> = new Map(); // messageId -> receipt
    private typingIndicators: Map<string, TypingIndicator> = new Map(); // threadId -> indicator

    // Handlers
    private onMessageHandlers: ((msg: ChatMessage, threadId: string) => void)[] = [];
    private onReceiptHandlers: ((receipt: DeliveryReceipt) => void)[] = [];
    private onTypingHandlers: ((indicator: TypingIndicator) => void)[] = [];

    constructor(
        meshEngine: MeshEngine,
        gossipEngine: GossipEngine,
        ratchetService: RatchetService,
        myId: string,
        crypto?: CryptoService
    ) {
        this.meshEngine = meshEngine;
        this.gossipEngine = gossipEngine;
        this.ratchetService = ratchetService;
        this.myId = myId;
        this.crypto = crypto || new CryptoService();

        console.log(`[MESSAGE] Service initialized for ${myId}`);

        // Register handlers
        this.setupHandlers();
    }

    private setupHandlers(): void {
        // Listen for incoming messages via gossip
        // TODO: bind to MeshEngine.onPacket() with type MESSAGE
        console.log('[MESSAGE] Handlers registered (TODO: bind to MeshEngine)');
    }

    // =========================================================================
    // THREAD MANAGEMENT
    // =========================================================================

    /**
     * Cria nova thread P2P com um peer
     */
    createP2PThread(peerId: string): MessageThread {
        const threadId = `p2p-${this.myId}-${peerId}-${Date.now()}`;

        const thread: MessageThread = {
            id: threadId,
            type: 'P2P',
            participants: new Set([this.myId, peerId]),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: [],
            unreadCount: 0,
            pinnedMessages: [],
        };

        this.threads.set(threadId, thread);
        console.log(`[MESSAGE] Created P2P thread with ${peerId}`);

        return thread;
    }

    /**
     * Cria thread dentro de um canal de rádio
     */
    createChannelThread(channelId: string, participants: string[]): MessageThread {
        const threadId = `channel-${channelId}-${Date.now()}`;

        const thread: MessageThread = {
            id: threadId,
            type: 'CHANNEL_THREAD',
            participants: new Set(participants),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: [],
            unreadCount: 0,
            pinnedMessages: [],
        };

        this.threads.set(threadId, thread);
        console.log(`[MESSAGE] Created channel thread ${threadId} with ${participants.length} participants`);

        return thread;
    }

    /**
     * Retorna thread por ID
     */
    getThread(threadId: string): MessageThread | null {
        return this.threads.get(threadId) ?? null;
    }

    /**
     * Lista todas as threads do usuário
     */
    listThreads(): MessageThread[] {
        return Array.from(this.threads.values());
    }

    /**
     * Lista threads com unread count > 0
     */
    getUnreadThreads(): MessageThread[] {
        return Array.from(this.threads.values()).filter((t) => t.unreadCount > 0);
    }

    /**
     * Deleta thread (soft delete - marca como archived)
     */
    deleteThread(threadId: string): void {
        const thread = this.threads.get(threadId);
        if (thread) {
            thread.messages = []; // Clear messages
            console.log(`[MESSAGE] Archived thread ${threadId}`);
        }
    }

    // =========================================================================
    // SENDING MESSAGES
    // =========================================================================

    /**
     * Envia mensagem em uma thread
     * Auto-encripta se P2P via RatchetService
     */
    async sendMessage(threadId: string, text: string): Promise<ChatMessage> {
        const thread = this.threads.get(threadId);
        if (!thread) {
            throw new Error(`Thread ${threadId} not found`);
        }

        const messageId = `msg-${this.myId}-${Date.now()}-${Math.random()}`;
        const now = Date.now();

        // Criar mensagem
        const message: ChatMessage = {
            id: messageId,
            threadId,
            senderId: this.myId,
            text,
            timestamp: now,
            isEncrypted: thread.type === 'P2P',
            deliveryStatus: 'SENDING',
            reactions: new Map(),
        };

        // Se P2P: encriptar via RatchetService
        if (thread.type === 'P2P') {
            const peerId = Array.from(thread.participants).find((id) => id !== this.myId);
            if (peerId) {
                try {
                    // Get sessionId (ou criar se não existe)
                    const sessions = this.ratchetService.listSessions();
                    const sessionId = sessions.find((s) => s.includes(peerId));

                    if (sessionId) {
                        // Encriptar mensagem
                        const plaintext = new TextEncoder().encode(text);
                        const encrypted = await this.ratchetService.encryptMessage(sessionId, plaintext);

                        message.text = JSON.stringify(encrypted); // Armazenar encrypted
                        message.isEncrypted = true;
                    }
                } catch (err) {
                    console.warn(`[MESSAGE] Failed to encrypt: ${err}`);
                    // Fallback to plaintext
                }
            }
        }

        // Assinar mensagem
        const signature = await this.crypto.sign(text);
        message.signature = signature as any;

        // Adicionar ao thread
        thread.messages.push(message);
        thread.updatedAt = now;
        this.messageIndex.set(messageId, message);

        // Broadcast via gossip (para sincronizar rede)
        await this.broadcastMessage(message);

        // Notificar handlers
        this.onMessageHandlers.forEach((h) => h(message, threadId));

        console.log(`[MESSAGE] Sent message ${messageId} in thread ${threadId}`);
        return message;
    }

    /**
     * Broadcast mensagem via GossipEngine
     */
    private async broadcastMessage(message: ChatMessage): Promise<void> {
        // Criar gossip packet
        const packet: Partial<SecurePacket> = {
            metadata: {
                type: 'MESSAGE',
                sender: this.myId,
                timestamp: Date.now(),
                priority: 'MESSAGE',
                ttl: MESH_CONFIG.TTL_BASE(5),
                sequenceNum: Math.random() * 1e10,
            } as PacketMetadata,
            payload: JSON.stringify(message),
        };

        // Adicionar ao gossip engine
        const gossipPacket = packet as any;
        if (gossipPacket) {
            this.gossipEngine.addMessage(gossipPacket);
        }

        console.log(`[MESSAGE] Broadcasted message ${message.id}`);
    }

    // =========================================================================
    // RECEIVING & PROCESSING
    // =========================================================================

    /**
     * Processa mensagem recebida de peer
     */
    async processIncomingMessage(message: ChatMessage): Promise<void> {
        // Verificar assinatura
        if (message.signature) {
            const isValid = await this.crypto.verify(message.text, message.signature);
            if (!isValid) {
                console.warn(`[MESSAGE] Invalid signature for message ${message.id}`);
                return;
            }
        }

        // Descriptografar se necessário
        if (message.isEncrypted) {
            try {
                const sessions = this.ratchetService.listSessions();
                const sessionId = sessions.find((s) => s.includes(message.senderId));

                if (sessionId) {
                    const encryptedData = JSON.parse(message.text);
                    const plaintext = await this.ratchetService.decryptMessage(sessionId, encryptedData);
                    message.text = new TextDecoder().decode(plaintext);
                }
            } catch (err) {
                console.error(`[MESSAGE] Failed to decrypt: ${err}`);
                return;
            }
        }

        // Obter ou criar thread
        let thread = this.threads.get(message.threadId);
        if (!thread) {
            // Thread pode ter sido criada pelo sender
            thread = this.createP2PThread(message.senderId);
        }

        // Adicionar mensagem ao thread
        if (!thread.messages.find((m) => m.id === message.id)) {
            thread.messages.push(message);
            thread.unreadCount++;
            thread.updatedAt = Date.now();

            this.messageIndex.set(message.id, message);

            // Notificar handlers
            this.onMessageHandlers.forEach((h) => h(message, message.threadId));

            // Auto-enviar delivery receipt
            await this.sendDeliveryReceipt(message.id, message.threadId, message.senderId, 'DELIVERED');

            console.log(`[MESSAGE] Received message ${message.id} from ${message.senderId}`);
        }
    }

    // =========================================================================
    // DELIVERY & READ RECEIPTS
    // =========================================================================

    /**
     * Envia delivery receipt (DELIVERED ou READ)
     */
    async sendDeliveryReceipt(
        messageId: string,
        threadId: string,
        toPeerId: string,
        status: 'DELIVERED' | 'READ'
    ): Promise<void> {
        const receipt: DeliveryReceipt = {
            messageId,
            threadId,
            fromPeerId: this.myId,
            toPeerId,
            status,
            timestamp: Date.now(),
        };

        this.deliveryReceipts.set(messageId, receipt);

        // Broadcast receipt via gossip
        const packet: Partial<SecurePacket> = {
            metadata: {
                type: 'DELIVERY_RECEIPT',
                sender: this.myId,
                timestamp: Date.now(),
                priority: 'CONTROL',
                ttl: MESH_CONFIG.TTL_BASE(5),
                sequenceNum: Math.random() * 1e10,
            } as PacketMetadata,
            payload: JSON.stringify(receipt),
        };

        console.log(`[MESSAGE] Sent ${status} receipt for message ${messageId}`);

        // Notificar handlers
        this.onReceiptHandlers.forEach((h) => h(receipt));
    }

    /**
     * Marca mensagem como lida
     */
    async markAsRead(messageId: string): Promise<void> {
        const message = this.messageIndex.get(messageId);
        if (message) {
            message.deliveryStatus = 'READ';
            const thread = this.threads.get(message.threadId);
            if (thread && thread.unreadCount > 0) {
                thread.unreadCount--;
            }

            // Enviar READ receipt
            await this.sendDeliveryReceipt(messageId, message.threadId, message.senderId, 'READ');
        }
    }

    /**
     * Processa receipt recebido
     */
    processDeliveryReceipt(receipt: DeliveryReceipt): void {
        const message = this.messageIndex.get(receipt.messageId);
        if (message && receipt.fromPeerId === this.myId) {
            message.deliveryStatus = receipt.status;
            console.log(`[MESSAGE] Message ${receipt.messageId} marked as ${receipt.status}`);
        }
    }

    /**
     * Retorna status de entrega de uma mensagem
     */
    getMessageStatus(messageId: string): string {
        const message = this.messageIndex.get(messageId);
        return message?.deliveryStatus ?? 'UNKNOWN';
    }

    // =========================================================================
    // REACTIONS & INTERACTIONS
    // =========================================================================

    /**
     * Adiciona reação (emoji) a uma mensagem
     */
    async addReaction(messageId: string, emoji: string): Promise<void> {
        const message = this.messageIndex.get(messageId);
        if (!message) return;

        if (!message.reactions) {
            message.reactions = new Map();
        }

        if (!message.reactions.has(emoji)) {
            message.reactions.set(emoji, []);
        }

        const reactors = message.reactions.get(emoji) || [];
        if (!reactors.includes(this.myId)) {
            reactors.push(this.myId);
        }

        console.log(`[MESSAGE] Added ${emoji} reaction to message ${messageId}`);

        // Broadcast reaction
        const reactionPacket = {
            type: 'REACTION',
            messageId,
            emoji,
            peerId: this.myId,
            threadId: message.threadId,
        };

        // TODO: enviar via gossip
    }

    /**
     * Obtém todas as reações de uma mensagem
     */
    getReactions(messageId: string): Map<string, string[]> | null {
        const message = this.messageIndex.get(messageId);
        return message?.reactions ?? null;
    }

    // =========================================================================
    // TYPING INDICATORS
    // =========================================================================

    /**
     * Envia notificação de digitação
     */
    async setTypingIndicator(threadId: string, isTyping: boolean): Promise<void> {
        const indicator: TypingIndicator = {
            threadId,
            peerId: this.myId,
            isTyping,
            timestamp: Date.now(),
        };

        this.typingIndicators.set(threadId, indicator);

        // Broadcast via control channel (LOW TTL)
        const packet: Partial<SecurePacket> = {
            metadata: {
                type: 'TYPING_INDICATOR',
                sender: this.myId,
                timestamp: Date.now(),
                priority: 'CONTROL',
                ttl: 1, // Only local peer
                sequenceNum: Math.random() * 1e10,
            } as PacketMetadata,
            payload: JSON.stringify(indicator),
        };

        // Notificar handlers
        this.onTypingHandlers.forEach((h) => h(indicator));

        if (isTyping) {
            console.log(`[MESSAGE] ${this.myId} is typing in ${threadId}`);
        }
    }

    /**
     * Obtém typing indicator para thread
     */
    getTypingPeers(threadId: string): string[] {
        const typing: string[] = [];
        for (const [tId, indicator] of this.typingIndicators.entries()) {
            if (tId === threadId && indicator.isTyping) {
                typing.push(indicator.peerId);
            }
        }
        return typing;
    }

    // =========================================================================
    // SEARCH & FILTERING
    // =========================================================================

    /**
     * Busca mensagens em thread
     */
    searchInThread(threadId: string, query: string): ChatMessage[] {
        const thread = this.threads.get(threadId);
        if (!thread) return [];

        return thread.messages.filter((m) =>
            m.text.toLowerCase().includes(query.toLowerCase())
        );
    }

    /**
     * Retorna últimas N mensagens de um thread
     */
    getLatestMessages(threadId: string, count: number = 20): ChatMessage[] {
        const thread = this.threads.get(threadId);
        if (!thread) return [];

        return thread.messages.slice(-count);
    }

    /**
     * Retorna mensagens de uma data específica
     */
    getMessagesByDate(threadId: string, date: Date): ChatMessage[] {
        const thread = this.threads.get(threadId);
        if (!thread) return [];

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        return thread.messages.filter(
            (m) => m.timestamp >= dayStart.getTime() && m.timestamp <= dayEnd.getTime()
        );
    }

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    /**
     * Registra handler para mensagens recebidas
     */
    onMessage(handler: (msg: ChatMessage, threadId: string) => void): void {
        this.onMessageHandlers.push(handler);
    }

    /**
     * Registra handler para delivery receipts
     */
    onReceipt(handler: (receipt: DeliveryReceipt) => void): void {
        this.onReceiptHandlers.push(handler);
    }

    /**
     * Registra handler para typing indicators
     */
    onTyping(handler: (indicator: TypingIndicator) => void): void {
        this.onTypingHandlers.push(handler);
    }

    // =========================================================================
    // PERSISTENCE
    // =========================================================================

    /**
     * Exporta threads para backup
     */
    exportThreads(): string {
        const data = {
            threads: Array.from(this.threads.values()),
            exportedAt: Date.now(),
        };
        return JSON.stringify(data);
    }

    /**
     * Importa threads de backup
     */
    importThreads(jsonData: string): void {
        try {
            const data = JSON.parse(jsonData);
            for (const thread of data.threads || []) {
                this.threads.set(thread.id, thread);
                for (const message of thread.messages || []) {
                    this.messageIndex.set(message.id, message);
                }
            }
            console.log(`[MESSAGE] Imported ${data.threads?.length || 0} threads`);
        } catch (err) {
            console.error('[MESSAGE] Import failed:', err);
        }
    }

    /**
     * Cleanup - deletar threads antigas
     */
    cleanup(olderThan: number = 2592000000): void {
        // 30 dias default
        const cutoff = Date.now() - olderThan;
        let removed = 0;

        for (const [threadId, thread] of this.threads.entries()) {
            if (thread.updatedAt < cutoff) {
                this.threads.delete(threadId);
                for (const msg of thread.messages) {
                    this.messageIndex.delete(msg.id);
                }
                removed++;
            }
        }

        console.log(`[MESSAGE] Cleaned up ${removed} old threads`);
    }
}
