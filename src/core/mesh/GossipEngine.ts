/**
 * AudNova V22.0 - GossipEngine (Parte 2: Push-Pull Sync)
 * Sincronização de estado via gossip protocol com anti-entropy
 * Baseado na engenharia Aether Elite V10.8.2
 */

import { SecurePacket } from '../types';
import { MESH_CONFIG } from '../config';
import { MeshEngine } from './MeshEngine';
import { CryptoService } from '../../services/CryptoService';

/**
 * Digest - resumo do estado local para sync
 * Usado no push-pull gossip para convergência
 */
export interface GossipDigest {
    version: bigint; // Logical clock
    nodeId: string;
    messageIds: Set<string>; // Mensagens que temos
    timestamp: number;
    ttl: number;
}

/**
 * Push message - enviamos nossa digest
 * {"type": "GOSSIP_PUSH", "digest": GossipDigest}
 */
export interface GossipPush {
    version: bigint;
    nodeId: string;
    messageIds: string[];
    timestamp: number;
}

/**
 * Pull request - pedimos mensagens que faltam
 * {"type": "GOSSIP_PULL", "missing": ["id1", "id2"]}
 */
export interface GossipPullRequest {
    requestId: string;
    nodeId: string;
    missingIds: string[];
    timestamp: number;
}

/**
 * Pull response - respondemos com as mensagens pedidas
 * {"type": "GOSSIP_PULL_RESPONSE", "messages": [packet, packet]}
 */
export interface GossipPullResponse {
    requestId: string;
    nodeId: string;
    messages: SecurePacket[];
    timestamp: number;
}

/**
 * GossipEngine - Sincronização P2P com push-pull
 * - Push: enviar nossa digest periodicamente
 * - Pull: requisitar mensagens que faltam
 * - Anti-entropy: sync automático a cada ANTI_ENTROPY_INTERVAL
 * - Convergence tracking: monitorar estado global
 */
export class GossipEngine {
    private meshEngine: MeshEngine;
    private crypto: CryptoService;
    private myId: string;

    // Estado local
    private localDigest: GossipDigest;
    private messageStore: Map<string, SecurePacket> = new Map();
    private versionClock: bigint = 0n;

    // Tracking convergence
    private peerVersions: Map<string, bigint> = new Map();
    private lastAntiEntropy: number = 0;
    private antiEntropyInterval: number = MESH_CONFIG.ANTI_ENTROPY_INTERVAL ?? 30000; // 30s default

    // Pending pulls
    private pendingPulls: Map<string, GossipPullRequest> = new Map();
    private pullTimeout: number = 5000; // 5s timeout

    constructor(meshEngine: MeshEngine, myId: string, crypto?: CryptoService) {
        this.meshEngine = meshEngine;
        this.myId = myId;
        this.crypto = crypto || new CryptoService();

        // Initialize digest
        this.localDigest = {
            version: this.versionClock,
            nodeId: myId,
            messageIds: new Set(),
            timestamp: Date.now(),
            ttl: MESH_CONFIG.TTL_BASE(5), // Assume small network
        };

        console.log(`[GOSSIP] Engine initialized for ${myId}`);

        // Register handlers
        this.registerHandlers();

        // Start anti-entropy loop
        this.startAntiEntropy();
    }

    // =========================================================================
    // PUSH - Enviamos nossa digest
    // =========================================================================

    /**
     * Envia nossa digest para k=3 peers aleatórios
     * PUSH é lightweight - só envia IDs, não mensagens interas
     */
    async pushDigest(): Promise<void> {
        const push: GossipPush = {
            version: this.versionClock,
            nodeId: this.myId,
            messageIds: Array.from(this.localDigest.messageIds),
            timestamp: Date.now(),
        };

        // Serializar e enviar via gossip
        const packet: Partial<SecurePacket> = {
            metadata: {
                type: 'GOSSIP_PUSH',
                sender: this.myId,
                timestamp: Date.now(),
                priority: 'CONTROL',
                ttl: MESH_CONFIG.TTL_BASE(5),
                sequenceNum: Math.random() * 1e10,
            } as PacketMetadata,
            payload: JSON.stringify(push),
        };

        // Enviar via broadcast (gossip automático)
        // MeshEngine.broadcast() vai fazer fan-out k=3
        console.log(`[GOSSIP] Pushing digest with ${push.messageIds.length} messages`);
    }

    // =========================================================================
    // PULL - Recebemos digest e pedimos o que falta
    // =========================================================================

    /**
     * Processa push recebido de peer
     * Compara com local e faz pull do que falta
     */
    async handleGossipPush(push: GossipPush): Promise<void> {
        console.log(`[GOSSIP] Received push from ${push.nodeId} with ${push.messageIds.length} messages`);

        // Update peer version
        this.peerVersions.set(push.nodeId, push.version);

        // Identifica o que falta
        const missing = push.messageIds.filter((id) => !this.messageStore.has(id));

        if (missing.length > 0) {
            // Faz pull request
            await this.pullMessages(push.nodeId, missing);
        }
    }

    /**
     * Envia pull request para peer específico
     * Pede as mensagens que faltam
     */
    private async pullMessages(peerId: string, missingIds: string[]): Promise<void> {
        const requestId = `${this.myId}-${Date.now()}-${Math.random()}`;

        const pullRequest: GossipPullRequest = {
            requestId,
            nodeId: this.myId,
            missingIds,
            timestamp: Date.now(),
        };

        // Armazenar pending pull
        this.pendingPulls.set(requestId, pullRequest);

        // Setup timeout
        setTimeout(() => {
            if (this.pendingPulls.has(requestId)) {
                console.warn(`[GOSSIP] Pull request ${requestId} timed out`);
                this.pendingPulls.delete(requestId);
            }
        }, this.pullTimeout);

        console.log(`[GOSSIP] Pulling ${missingIds.length} missing messages from ${peerId}`);

        // Enviar unicast directly (não via gossip)
        // MeshEngine.unicast(packet, peerId)
    }

    /**
     * Processa pull request de peer
     * Respondemos com as mensagens que ele pediu
     */
    async handleGossipPullRequest(request: GossipPullRequest): Promise<void> {
        console.log(`[GOSSIP] Received pull request from ${request.nodeId} for ${request.missingIds.length} messages`);

        // Reunir mensagens que foram solicitadas
        const messages: SecurePacket[] = [];
        for (const id of request.missingIds) {
            if (this.messageStore.has(id)) {
                messages.push(this.messageStore.get(id)!);
            }
        }

        // Enviar response
        const response: GossipPullResponse = {
            requestId: request.requestId,
            nodeId: this.myId,
            messages,
            timestamp: Date.now(),
        };

        console.log(`[GOSSIP] Responding with ${messages.length} messages to ${request.nodeId}`);
        // Enviar via unicast
    }

    /**
     * Processa pull response
     * Integra mensagens recebidas ao local store
     */
    async handleGossipPullResponse(response: GossipPullResponse): Promise<void> {
        console.log(`[GOSSIP] Received ${response.messages.length} messages in pull response`);

        // Integrar mensagens ao messageStore
        for (const message of response.messages) {
            // TODO: validar assinatura
            this.addMessage(message);
        }

        // Clear pending pull
        this.pendingPulls.delete(response.requestId);
    }

    // =========================================================================
    // MESSAGE MANAGEMENT
    // =========================================================================

    /**
     * Adiciona mensagem ao local store
     * Atualiza version clock
     */
    addMessage(packet: SecurePacket): void {
        const packetId = this.crypto.sha256(JSON.stringify(packet));

        if (!this.messageStore.has(packetId)) {
            this.messageStore.set(packetId, packet);
            this.localDigest.messageIds.add(packetId);

            // Increment version clock
            this.versionClock += 1n;
            this.localDigest.version = this.versionClock;

            console.log(`[GOSSIP] Added message ${packetId.substring(0, 8)}...`);
        }
    }

    /**
     * Recupera mensagem por ID
     */
    getMessage(id: string): SecurePacket | undefined {
        return this.messageStore.get(id);
    }

    /**
     * Retorna todas as mensagens (para backup/sync)
     */
    getAllMessages(): SecurePacket[] {
        return Array.from(this.messageStore.values());
    }

    // =========================================================================
    // ANTI-ENTROPY
    // =========================================================================

    /**
     * Loop de anti-entropy
     * Periodicamente push digest para garantir convergência
     */
    private startAntiEntropy(): void {
        setInterval(() => {
            const now = Date.now();
            if (now - this.lastAntiEntropy > this.antiEntropyInterval) {
                this.pushDigest().catch((err) => {
                    console.error('[GOSSIP] Anti-entropy error:', err);
                });
                this.lastAntiEntropy = now;
            }
        }, this.antiEntropyInterval);
    }

    // =========================================================================
    // CONVERGENCE TRACKING
    // =========================================================================

    /**
     * Calcula convergence - quantos peers estão sincronizados?
     * Retorna percentual de peers com version >= local version
     */
    getConvergenceStatus(): {
        synced: number;
        total: number;
        percentage: number;
    } {
        const peers = Array.from(this.peerVersions.values());
        const synced = peers.filter((v) => v >= this.versionClock).length;

        return {
            synced,
            total: peers.length,
            percentage: peers.length > 0 ? (synced / peers.length) * 100 : 0,
        };
    }

    /**
     * Retorna status detalhado de sync com cada peer
     */
    getPeerSyncStatus(): Array<{
        peerId: string;
        version: bigint;
        isSynced: boolean;
    }> {
        return Array.from(this.peerVersions.entries()).map(([peerId, version]) => ({
            peerId,
            version,
            isSynced: version >= this.versionClock,
        }));
    }

    // =========================================================================
    // HANDLERS
    // =========================================================================

    /**
     * Registra handlers para mensagens gossip
     */
    private registerHandlers(): void {
        // TODO: conectar a MeshEngine.onPacket() com types GOSSIP_*
        console.log('[GOSSIP] Handlers registered (TODO: bind to MeshEngine)');
    }

    // =========================================================================
    // CLEANUP
    // =========================================================================

    /**
     * Limpa estado stale
     * Remove mensagens antigas (>24h)
     */
    prune(olderThanMs: number = 86400000): void {
        const cutoff = Date.now() - olderThanMs;
        let removed = 0;

        for (const [id, packet] of this.messageStore.entries()) {
            if (packet.metadata.timestamp < cutoff) {
                this.messageStore.delete(id);
                this.localDigest.messageIds.delete(id);
                removed++;
            }
        }

        console.log(`[GOSSIP] Pruned ${removed} old messages`);
    }

    /**
     * Reset total do engine
     */
    reset(): void {
        this.messageStore.clear();
        this.localDigest.messageIds.clear();
        this.versionClock = 0n;
        this.peerVersions.clear();
        this.pendingPulls.clear();
        console.log('[GOSSIP] Engine reset');
    }
}

// Type guard para PacketMetadata (import necessário)
type PacketMetadata = any; // TODO: import de types
