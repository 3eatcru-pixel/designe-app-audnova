/**
 * AudNova V22.0 - MeshTransport (Abstract Base)
 * Camada abstrata para BLE, WiFi Direct, TCP
 * Baseado na engenharia Aether Elite V10.8.2
 */

import { SecurePacket, PeerInfo } from '../types';
import { MESH_CONFIG } from '../config';

/**
 * Interface que todo transport precisa implementar
 * - BLE (React Native)
 * - WiFi Direct (React Native)
 * - TCP (Node.js / fallback)
 * - Mock (testes)
 */
export abstract class MeshTransport {
    protected peerId: string;
    protected peers: Map<string, PeerInfo> = new Map();
    protected messageHandlers: ((msg: SecurePacket) => void)[] = [];
    protected _isConnected: boolean = false;

    constructor(peerId: string) {
        this.peerId = peerId;
    }

    // =========================================================================
    // ABSTRACT METHODS - Implementar em subclasses
    // =========================================================================

    /**
     * Inicia o transporte (descoberta, listening, etc)
     */
    abstract async init(): Promise<void>;

    /**
     * Para o transporte
     */
    abstract async shutdown(): Promise<void>;

    /**
     * Envia dados para um peer específico
     */
    abstract async sendToPeer(peerId: string, data: Uint8Array): Promise<void>;

    /**
     * Broadcast para todos os peers conectados
     */
    abstract async broadcast(data: Uint8Array): Promise<void>;

    /**
     * Descobrir novo peer (BLE scan, WiFi sync, etc)
     */
    abstract async discoverPeers(): Promise<PeerInfo[]>;

    // =========================================================================
    // STANDARD METHODS - Implementação base
    // =========================================================================

    /**
     * Registra um peer na tabela local
     */
    registerPeer(peer: PeerInfo): void {
        this.peers.set(peer.id, {
            ...peer,
            lastSeen: Date.now(),
            isOnline: true,
        });
    }

    /**
     * Remove um peer (timeout, disconnect)
     */
    removePeer(peerId: string): void {
        this.peers.delete(peerId);
    }

    /**
     * Retorna lista de peers conhecidos
     */
    getPeers(): PeerInfo[] {
        return Array.from(this.peers.values()).filter((p) => !this.isPeerStale(p));
    }

    /**
     * Verifica se peer expirou (non-responsive)
     */
    protected isPeerStale(peer: PeerInfo): boolean {
        const elapsed = Date.now() - peer.lastSeen;
        return elapsed > MESH_CONFIG.PEER_TIMEOUT_MS;
    }

    /**
     * Registra handler para mensagens recebidas
     */
    onMessage(handler: (msg: SecurePacket) => void): void {
        this.messageHandlers.push(handler);
    }

    /**
     * Dispara handlers quando mensagem chega
     */
    protected emitMessage(packet: SecurePacket): void {
        this.messageHandlers.forEach((handler) => {
            try {
                handler(packet);
            } catch (error) {
                console.error(`[MESH] Message handler error: ${error}`);
            }
        });
    }

    /**
     * Retorna ID do peer local
     */
    getId(): string {
        return this.peerId;
    }

    /**
     * Status de conexão
     */
    isConnected(): boolean {
        return this._isConnected;
    }

    /**
     * Atualiza lastSeen de um peer
     */
    protected updatePeerActivity(peerId: string): void {
        const peer = this.peers.get(peerId);
        if (peer) {
            peer.lastSeen = Date.now();
            peer.isOnline = true;
        }
    }

    /**
     * Cleanup de peers expirados
     */
    protected purgeStalePeers(): void {
        for (const [peerId, peer] of this.peers.entries()) {
            if (this.isPeerStale(peer)) {
                console.log(`[MESH] Removing stale peer: ${peerId}`);
                this.removePeer(peerId);
            }
        }
    }
}

/**
 * MockTransport - Para testes locais (sem BLE/WiFi real)
 * Simula uma rede P2P rápida via memory
 */
export class MockTransport extends MeshTransport {
    private globalPeerMap: Map<string, MockTransport> = new Map();
    private packetQueue: SecurePacket[] = [];
    private simulateLatencyMs: number = 0;

    constructor(peerId: string, globalMap?: Map<string, MockTransport>) {
        super(peerId);
        if (globalMap) {
            this.globalPeerMap = globalMap;
        }
    }

    async init(): Promise<void> {
        this.globalPeerMap.set(this.peerId, this);
        this._isConnected = true;
        console.log(`[MOCK] Transport initialized for ${this.peerId}`);
    }

    async shutdown(): Promise<void> {
        this.globalPeerMap.delete(this.peerId);
        this.messageHandlers = [];
        this._isConnected = false;
        console.log(`[MOCK] Transport shutdown for ${this.peerId}`);
    }

    async sendToPeer(peerId: string, data: Uint8Array): Promise<void> {
        const targetTransport = this.globalPeerMap.get(peerId);
        if (!targetTransport) {
            console.warn(`[MOCK] Peer not found: ${peerId}`);
            return;
        }

        // Simular latência
        if (this.simulateLatencyMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, this.simulateLatencyMs));
        }

        // Envelope fake para demo
        // Em produção, seria SecurePacket real
        console.log(`[MOCK] Send ${data.length} bytes to ${peerId}`);
    }

    async broadcast(data: Uint8Array): Promise<void> {
        const targets = this.getPeers();
        const promises = targets.map((peer) => this.sendToPeer(peer.id, data));
        await Promise.all(promises);
        console.log(`[MOCK] Broadcast to ${targets.length} peers`);
    }

    async discoverPeers(): Promise<PeerInfo[]> {
        const discovered: PeerInfo[] = [];
        for (const [id, transport] of this.globalPeerMap.entries()) {
            if (id !== this.peerId) {
                discovered.push({
                    id,
                    signal: -50 + Math.random() * 40, // Fake RSSI
                    distance: 1,
                    lastSeen: Date.now(),
                    publicKey: 'mock-key',
                    isOnline: true,
                });
            }
        }
        return discovered;
    }

    /**
     * Simula recebimento de pacote (para testes)
     */
    async simulateIncomingPacket(packet: SecurePacket): Promise<void> {
        this.updatePeerActivity(packet.metadata.from);
        this.emitMessage(packet);
    }

    /**
     * Configura latência artificial para testes realistas
     */
    setSimulateLatency(ms: number): void {
        this.simulateLatencyMs = ms;
    }
}
