/**
 * AudNova V22.0 - MeshEngine (Parte 1: Core Structure)
 * Motor de mesh: roteamento, gossip, deduplicação
 * Baseado na engenharia Aether Elite V10.8.2
 */

import { SecurePacket, NetworkRoute, PeerInfo, PacketMetadata } from '../types';
import { MESH_CONFIG, PRIORITIES } from '../config';
import { MeshTransport } from '../transport/MeshTransport';
import { CryptoService } from '../../services/CryptoService';

/**
 * MeshEngine - Orquestra a rede P2P
 * - Roteamento dinâmico com TTL adaptativo
 * - Deduplicação com janelas anti-replay
 * - Gossip push-pull com fan-out k=3
 * - Priority queue (EMERGENCY > CONTROL > MESSAGE > AUDIO)
 */
export class MeshEngine {
    private transport: MeshTransport;
    private crypto: CryptoService;
    private myId: string;

    // Roteamento
    private routingTable: Map<string, NetworkRoute> = new Map();
    private networkMap: NetworkRoute[] = [];

    // Deduplicação
    private seenPackets: Map<string, number> = new Map(); // packetId -> timestamp
    private dedupWindow: number = MESH_CONFIG.DEDUP_WINDOW_MS;

    // Prioridade
    private messageQueue: SecurePacket[] = [];
    private isProcessing: boolean = false;

    // Handlers
    private incomingHandlers: ((packet: SecurePacket) => void)[] = [];

    constructor(transport: MeshTransport, crypto?: CryptoService) {
        this.transport = transport;
        this.crypto = crypto || new CryptoService();
        this.myId = transport.getId();

        // Setup listener no transport
        this.transport.onMessage((packet) => this.handleIncomingPacket(packet));

        console.log(`[MESH] Engine initialized for ${this.myId}`);
    }

    // =========================================================================
    // LIFECYCLE
    // =========================================================================

    /**
     * Inicia o motor mesh
     */
    async start(): Promise<void> {
        await this.transport.init();
        this.startMaintenanceLoop();
        console.log('[MESH] Engine started');
    }

    /**
     * Para o motor mesh
     */
    async stop(): Promise<void> {
        this.isProcessing = false;
        await this.transport.shutdown();
        console.log('[MESH] Engine stopped');
    }

    // =========================================================================
    // SEND & BROADCAST
    // =========================================================================

    /**
     * Envia pacote para peer específico (unicast)
     */
    async unicast(packet: SecurePacket, to: string): Promise<void> {
        // Validar
        if (!packet.metadata.id) {
            packet.metadata.id = this.generatePacketId();
        }

        // Marcar como enviado
        this.seenPackets.set(packet.metadata.id, Date.now());

        console.log(
            `[MESH] Unicast ${packet.metadata.type} to ${to} ` +
            `(id=${packet.metadata.id.slice(0, 8)})`
        );

        // Serializar e enviar
        const data = this.serializePacket(packet);
        await this.transport.sendToPeer(to, data);
    }

    /**
     * Broadcast com gossip (fan-out k=3)
     */
    async broadcast(packet: SecurePacket): Promise<void> {
        // Validar
        if (!packet.metadata.id) {
            packet.metadata.id = this.generatePacketId();
        }

        packet.metadata.to = undefined; // Broadcast
        packet.metadata.ttl = MESH_CONFIG.TTL_BASE(this.transport.getPeers().length);

        // Marcar como visto
        this.seenPackets.set(packet.metadata.id, Date.now());

        console.log(
            `[MESH] Broadcast ${packet.metadata.type} ttl=${packet.metadata.ttl} ` +
            `(id=${packet.metadata.id.slice(0, 8)})`
        );

        // Gossip: selecionar k=3 peers aleatoriamente
        const peers = this.transport.getPeers();
        const fanOut = Math.min(MESH_CONFIG.GOSSIP_FAN_OUT, peers.length);
        const selected = this.selectRandomPeers(fanOut, peers);

        const data = this.serializePacket(packet);
        for (const peer of selected) {
            await this.transport.sendToPeer(peer.id, data).catch((err) => {
                console.warn(`[MESH] Send to ${peer.id} failed: ${err}`);
            });
        }
    }

    // =========================================================================
    // INCOMING PACKET HANDLING
    // =========================================================================

    /**
     * Handler principal para pacotes recebidos
     */
    private async handleIncomingPacket(packet: SecurePacket): Promise<void> {
        // 1. Anti-replay: verificar se já vimos
        if (this.isDuplicate(packet.metadata.id)) {
            console.log(`[MESH] Duplicate packet dropped (id=${packet.metadata.id.slice(0, 8)})`);
            return;
        }

        // 2. Marcar como visto
        this.seenPackets.set(packet.metadata.id, Date.now());

        // 3. Verificar TTL
        if (packet.metadata.ttl <= 0) {
            console.log('[MESH] TTL expired, dropping');
            return;
        }

        // 4. Rotear se não é pra mim
        if (packet.metadata.to && packet.metadata.to !== this.myId) {
            packet.metadata.ttl--;
            await this.routePacket(packet);
            return;
        }

        // 5. É pra mim! Enfileirar por prioridade
        this.enqueuePacket(packet);

        // 6. Emitir handlers
        this.incomingHandlers.forEach((handler) => {
            try {
                handler(packet);
            } catch (error) {
                console.error(`[MESH] Handler error: ${error}`);
            }
        });
    }

    /**
     * Roteia pacote para próximo hop
     */
    private async routePacket(packet: SecurePacket): Promise<void> {
        const dest = packet.metadata.to;
        if (!dest) return;

        const route = this.routingTable.get(dest);
        if (!route) {
            console.warn(`[MESH] No route to ${dest}`);
            return;
        }

        console.log(`[MESH] Routing ${packet.metadata.type} to ${dest} via ${route.nextHop}`);
        await this.unicast(packet, route.nextHop);
    }

    // =========================================================================
    // PACKET QUEUE & PRIORITIES
    // =========================================================================

    /**
     * Enfileira pacote por prioridade
     */
    private enqueuePacket(packet: SecurePacket): void {
        this.messageQueue.push(packet);

        // Reordenar por prioridade
        const priorityOrder = ['emergency', 'high', 'normal', 'low'];
        this.messageQueue.sort((a, b) => {
            const aIdx = priorityOrder.indexOf(a.metadata.priority);
            const bIdx = priorityOrder.indexOf(b.metadata.priority);
            return aIdx - bIdx;
        });
    }

    /**
     * Processa fila de mensagens
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.messageQueue.length > 0 && this.isProcessing) {
            const packet = this.messageQueue.shift();
            if (packet) {
                console.log(`[MESH] Processing ${packet.metadata.priority} ${packet.metadata.type}`);
                await new Promise((r) => setTimeout(r, 10)); // Yield
            }
        }

        this.isProcessing = false;
    }

    // =========================================================================
    // ROUTING & NETWORK MAP
    // =========================================================================

    /**
     * Retorna mapa de rede atual
     */
    getNetworkMap(): NetworkRoute[] {
        return [...this.networkMap];
    }

    /**
     * Atualiza rota a um destino
     */
    updateRoute(destinationId: string, nextHop: string, distance: number): void {
        const route: NetworkRoute = {
            destination: destinationId,
            nextHop,
            distance,
            quality: 0.8 + Math.random() * 0.2, // Simulado
            lastUpdated: Date.now(),
        };

        this.routingTable.set(destinationId, route);

        // Manter network map atualizado
        this.networkMap = Array.from(this.routingTable.values());

        console.log(`[MESH] Route updated: ${destinationId} -> ${nextHop} (${distance} hops)`);
    }

    // =========================================================================
    // HELPERS & UTILITIES
    // =========================================================================

    /**
     * Verifica duplicação
     */
    private isDuplicate(packetId: string): boolean {
        const seen = this.seenPackets.get(packetId);
        if (!seen) return false;

        const age = Date.now() - seen;
        return age < this.dedupWindow;
    }

    /**
     * Gera ID único para pacote
     */
    private generatePacketId(): string {
        return `${this.myId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }

    /**
     * Seleciona N peers aleatoriamente
     */
    private selectRandomPeers(n: number, peers: PeerInfo[]): PeerInfo[] {
        if (peers.length <= n) return peers;

        const selected: PeerInfo[] = [];
        const indices = new Set<number>();

        while (selected.length < n) {
            const idx = Math.floor(Math.random() * peers.length);
            if (!indices.has(idx)) {
                indices.add(idx);
                selected.push(peers[idx]);
            }
        }

        return selected;
    }

    /**
     * Serializa para envio (placeholder)
     */
    private serializePacket(packet: SecurePacket): Uint8Array {
        const json = JSON.stringify(packet);
        return new TextEncoder().encode(json);
    }

    /**
     * Cleanup periódico
     */
    private startMaintenanceLoop(): void {
        setInterval(() => {
            // Limpar packets vistos expirados
            const now = Date.now();
            for (const [id, ts] of this.seenPackets.entries()) {
                if (now - ts > this.dedupWindow * 2) {
                    this.seenPackets.delete(id);
                }
            }

            // Processar fila
            this.processQueue().catch((err) => {
                console.error(`[MESH] Queue processing error: ${err}`);
            });
        }, 5000); // A cada 5s
    }

    /**
     * Registra handler para pacotes
     */
    onPacket(handler: (packet: SecurePacket) => void): void {
        this.incomingHandlers.push(handler);
    }
}

/**
 * Factory com config padrão
 */
export function createMeshEngine(transport: MeshTransport, crypto?: CryptoService): MeshEngine {
    return new MeshEngine(transport, crypto);
}
