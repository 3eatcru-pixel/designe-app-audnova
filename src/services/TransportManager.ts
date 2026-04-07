/**
 * AudNova V22.0 - Transport Manager
 * Manages multiple transports (Mock, BLE, WiFi) with intelligent selection
 * Provides fallback and hybrid transport modes
 */

import { MeshTransport, TransportMessage, Peer } from './MeshTransport';
import { BleTransport } from './BleTransport';
import { WifiTransport } from './WifiTransport';
import { MockTransport } from './MockTransport';

/**
 * Transport Priority Enum
 */
export enum TransportPriority {
    WIFI = 1, // Highest bandwidth
    BLE = 2, // Medium bandwidth, good for mobile
    MOCK = 3, // Fallback for testing
}

/**
 * Transport Selection Strategy
 */
export enum SelectionStrategy {
    FASTEST = 'fastest', // Choose by signal/latency
    MOST_RELIABLE = 'most_reliable', // Choose by packet delivery
    HYBRID = 'hybrid', // Use multiple for redundancy
    WIFI_FIRST = 'wifi_first', // Prefer WiFi
    BLE_FIRST = 'ble_first', // Prefer BLE
}

/**
 * TransportManager - Intelligently manage multiple mesh transports
 */
export class TransportManager {
    private transports: Map<string, MeshTransport> = new Map();
    private activeTransports: Set<string> = new Set();
    private strategy: SelectionStrategy = SelectionStrategy.HYBRID;
    private metrics: Map<string, any> = new Map();
    private listeners: Map<string, Function[]> = new Map();

    constructor(strategy: SelectionStrategy = SelectionStrategy.HYBRID) {
        this.strategy = strategy;
        console.log(`🎛️  TransportManager initialized (strategy: ${strategy})`);
    }

    /**
     * Initialize all available transports
     */
    async initializeTransports(): Promise<void> {
        console.log('⚙️  Initializing transports...');

        // Always initialize mock for fallback
        const mockTransport = new MockTransport();
        this.registerTransport('mock', mockTransport, TransportPriority.MOCK);

        // Try to initialize BLE (if available)
        try {
            const bleTransport = new BleTransport();
            this.registerTransport('ble', bleTransport, TransportPriority.BLE);
            console.log('✅ BLE Transport registered');
        } catch (error) {
            console.warn('⚠️  BLE Transport unavailable:', error);
        }

        // Try to initialize WiFi (if available)
        try {
            const wifiTransport = new WifiTransport();
            this.registerTransport('wifi', wifiTransport, TransportPriority.WIFI);
            console.log('✅ WiFi Transport registered');
        } catch (error) {
            console.warn('⚠️  WiFi Transport unavailable:', error);
        }

        // Start discovery on all transports
        for (const transport of this.transports.values()) {
            try {
                await transport.startScanning();
                this.activeTransports.add(transport.type);
                console.log(`📡 ${transport.name} scan started`);
            } catch (error) {
                console.warn(`⚠️  Failed to start ${transport.name} scan:`, error);
            }
        }
    }

    /**
     * Register a transport
     */
    private registerTransport(key: string, transport: MeshTransport, priority: TransportPriority): void {
        this.transports.set(key, transport);

        // Setup event forwarding
        transport.on('message', (msg: TransportMessage) => {
            this.emit('message', msg);
        });

        transport.on('peer-connected', (data: any) => {
            this.emit('peer-connected', { ...data, transport: key });
        });

        transport.on('peer-disconnected', (data: any) => {
            this.emit('peer-disconnected', { ...data, transport: key });
        });

        console.log(`✅ Registered ${key} transport (priority: ${priority})`);
    }

    /**
     * Send to peer using best available transport
     */
    async sendToPeer(peerId: string, data: Uint8Array): Promise<boolean> {
        if (this.strategy === SelectionStrategy.HYBRID) {
            return this.sendHybrid(peerId, data);
        }

        const transport = this.selectBestTransport(peerId);
        if (!transport) {
            console.error(`❌ No transport available for ${peerId}`);
            return false;
        }

        return transport.sendToPeer(peerId, data);
    }

    /**
     * Hybrid send: Use multiple transports for reliability
     */
    private async sendHybrid(peerId: string, data: Uint8Array): Promise<boolean> {
        const activePeers = this.getActivePeers();
        const results = [];

        for (const transport of this.transports.values()) {
            if (activePeers.find(p => p.id === peerId)) {
                try {
                    const result = await transport.sendToPeer(peerId, data);
                    results.push(result);
                } catch (error) {
                    console.warn(`⚠️  ${transport.name} send failed:`, error);
                }
            }
        }

        return results.some(r => r === true);
    }

    /**
     * Select best transport based on strategy
     */
    private selectBestTransport(peerId: string): MeshTransport | null {
        const connectedPeers = this.getActivePeers();

        if (this.strategy === SelectionStrategy.FASTEST) {
            // Choose by signal strength + latency
            return this.getTransportBySignal(peerId);
        } else if (this.strategy === SelectionStrategy.WIFI_FIRST) {
            return this.transports.get('wifi') || this.transports.get('ble') || this.transports.get('mock') || null;
        } else if (this.strategy === SelectionStrategy.BLE_FIRST) {
            return this.transports.get('ble') || this.transports.get('wifi') || this.transports.get('mock') || null;
        }

        // Default: MOST_RELIABLE
        return this.getTransportByReliability(peerId);
    }

    /**
     * Get transport with best signal
     */
    private getTransportBySignal(peerId: string): MeshTransport | null {
        let best: { transport: MeshTransport; signal: number } | null = null;

        for (const transport of this.transports.values()) {
            const signal = transport.getSignalStrength(peerId);
            if (signal > 0 && (!best || signal > best.signal)) {
                best = { transport, signal };
            }
        }

        return best?.transport || null;
    }

    /**
     * Get most reliable transport (highest delivery rate)
     */
    private getTransportByReliability(peerId: string): MeshTransport | null {
        let best: { transport: MeshTransport; reliability: number } | null = null;

        for (const transport of this.transports.values()) {
            const stats = transport.getStats ? transport.getStats() : {};
            const reliability = (stats.deliveryRate || 100) + (stats.latency || 0) * -0.1;

            if (!best || reliability > best.reliability) {
                best = { transport, reliability };
            }
        }

        return best?.transport || null;
    }

    /**
     * Get all active (discovered) peers
     */
    getActivePeers(): Peer[] {
        const peers = new Map<string, Peer>();

        for (const transport of this.transports.values()) {
            const discovered = transport.getDiscoveredPeers();
            for (const peer of discovered) {
                if (!peers.has(peer.id) || peer.lastSeen > (peers.get(peer.id)?.lastSeen || 0)) {
                    peers.set(peer.id, peer);
                }
            }
        }

        return Array.from(peers.values());
    }

    /**
     * Broadcast to all peers
     */
    async broadcast(data: Uint8Array): Promise<number> {
        let totalSent = 0;

        for (const transport of this.transports.values()) {
            const sent = await transport.broadcast(data);
            totalSent += sent;
        }

        return totalSent;
    }

    /**
     * Get transport statistics
     */
    getMetrics() {
        const metrics: any = {
            strategy: this.strategy,
            activeTransports: Array.from(this.activeTransports),
            peers: this.getActivePeers(),
            transports: {},
        };

        for (const [key, transport] of this.transports) {
            metrics.transports[key] = {
                type: transport.type,
                name: transport.name,
                connected: transport.getConnectedPeers().length,
                discovered: transport.getDiscoveredPeers().length,
                stats: transport.getStats ? transport.getStats() : {},
            };
        }

        return metrics;
    }

    /**
     * Disconnect all transports
     */
    async disconnect(): Promise<void> {
        console.log('🔌 Disconnecting all transports...');

        for (const transport of this.transports.values()) {
            try {
                await transport.disconnect();
            } catch (error) {
                console.warn(`⚠️  Error disconnecting ${transport.name}:`, error);
            }
        }

        this.activeTransports.clear();
        console.log('✅ All transports disconnected');
    }

    /**
     * Event listener management
     */
    on(event: string, callback: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    off(event: string, callback: Function): void {
        const callbacks = this.listeners.get(event);
        if (callbacks) {
            this.listeners.set(
                event,
                callbacks.filter(cb => cb !== callback),
            );
        }
    }

    private emit(event: string, data: any): void {
        const callbacks = this.listeners.get(event) || [];
        for (const callback of callbacks) {
            callback(data);
        }
    }
}

export default TransportManager;
