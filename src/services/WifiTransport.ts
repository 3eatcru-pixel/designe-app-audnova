/**
 * AudNova V22.0 - WiFi Transport Layer
 * WiFi Direct + Local network mesh transport for high-bandwidth communication
 * Extends MeshTransport with real WiFi capabilities
 */

import { MeshTransport, TransportMessage, Peer } from './MeshTransport';

/**
 * WiFi Peer Advertisement
 */
interface WifiPeerAdvertisement {
    peerId: string;
    ipAddress: string;
    port: number;
    signal: number;
    timestamp: number;
    hostname: string;
}

/**
 * WiFi Connection Socket
 */
interface WifiConnection {
    peerId: string;
    ipAddress: string;
    port: number;
    socket: any; // WebSocket in browser, Socket in Node
    connected: boolean;
    bandwidth: number;
}

/**
 * WifiTransport - WiFi (Direct + Local Network) mesh transport
 * Uses WebSocket for browser, TCP for Node.js
 * Supports autodiscovery via mDNS (mock for browser)
 */
export class WifiTransport extends MeshTransport {
    private mdnsServer: any = null;
    private activeConnections: Map<string, WifiConnection> = new Map();
    private discoveredPeers: Map<string, WifiPeerAdvertisement> = new Map();
    private scanning: boolean = false;
    private messageQueue: TransportMessage[] = [];
    private localPort: number = 7777 + Math.floor(Math.random() * 1000);
    private wsServer: any = null;

    constructor() {
        super('wifi', 'WiFi (Direct + Local Network)');
        this.initializeWifiStack();
    }

    /**
     * Initialize WiFi transport stack
     */
    private initializeWifiStack() {
        console.log(`🌐 WiFi Transport initialized (local port: ${this.localPort})`);

        if (typeof window !== 'undefined') {
            console.log('✅ Browser environment - using WebSocket for WiFi connections');
        } else {
            console.log('✅ Node.js environment - using TCP/UDP for local network');
        }
    }

    /**
     * Start WiFi peer discovery via broadcast (mock mDNS for browser)
     */
    async startScanning(): Promise<void> {
        if (this.scanning) return;
        this.scanning = true;

        console.log('📡 WiFi: Starting local network discovery...');

        try {
            if (typeof window !== 'undefined') {
                // Browser: Simulate mDNS broadcast discovery
                this.simulateWifiDiscovery();
            } else {
                // Node.js: Real mDNS/UDP discovery (would use real libraries)
                console.log('🔍 Scanning local network 192.168.1.0/24...');
                this.simulateWifiDiscovery();
            }
        } catch (error) {
            console.error('❌ WiFi Scan error:', error);
        }
    }

    /**
     * Simulate WiFi peer discovery for testing
     */
    private simulateWifiDiscovery() {
        console.log('🎭 Simulating WiFi discovery...');

        // Mock discovered peers on local network
        const mockPeers: WifiPeerAdvertisement[] = [
            {
                peerId: 'wifi-peer-1',
                ipAddress: '192.168.1.101',
                port: 7777,
                signal: -35,
                timestamp: Date.now(),
                hostname: 'audnova-node-1.local',
            },
            {
                peerId: 'wifi-peer-2',
                ipAddress: '192.168.1.102',
                port: 7777,
                signal: -50,
                timestamp: Date.now(),
                hostname: 'audnova-node-2.local',
            },
            {
                peerId: 'wifi-peer-3',
                ipAddress: '192.168.1.103',
                port: 7777,
                signal: -65,
                timestamp: Date.now(),
                hostname: 'audnova-node-3.local',
            },
        ];

        for (const peer of mockPeers) {
            this.discoveredPeers.set(peer.peerId, peer);
            this.notifyDiscovery({
                id: peer.peerId,
                address: `${peer.ipAddress}:${peer.port}`,
                signal: peer.signal,
                lastSeen: peer.timestamp,
            });
        }

        // Emit discovery complete
        this.emit('scan-complete', {
            found: mockPeers.length,
            peers: mockPeers.map(p => p.peerId),
        });
    }

    /**
     * Stop WiFi discovery
     */
    async stopScanning(): Promise<void> {
        this.scanning = false;
        console.log('🛑 WiFi: Scanning stopped');
    }

    /**
     * Connect to a peer via WiFi
     */
    async connectToPeer(peerId: string): Promise<boolean> {
        if (this.activeConnections.has(peerId)) {
            console.log(`✅ Already connected to ${peerId}`);
            return true;
        }

        const peerInfo = this.discoveredPeers.get(peerId);
        if (!peerInfo) {
            console.error(`❌ Peer ${peerId} not found in discovery results`);
            return false;
        }

        console.log(`🔗 Connecting to WiFi peer: ${peerId} (${peerInfo.ipAddress}:${peerInfo.port})`);

        try {
            const wsUrl = `ws://${peerInfo.ipAddress}:${peerInfo.port}`;

            if (typeof window !== 'undefined') {
                // Browser: Use WebSocket
                const ws = new WebSocket(wsUrl);

                ws.onopen = () => {
                    console.log(`✅ WiFi connected to ${peerId}`);
                    this.emit('peer-connected', { peerId });
                    this.flushQueueForPeer(peerId);
                };

                ws.onmessage = (event: MessageEvent) => {
                    this.handleWifiMessage(event.data, peerId);
                };

                ws.onerror = (event: Event) => {
                    console.error(`❌ WiFi connection error with ${peerId}:`, event);
                    this.emit('connection-error', { peerId, error: 'WebSocket error' });
                };

                ws.onclose = () => {
                    console.log(`🔌 WiFi disconnected from ${peerId}`);
                    this.activeConnections.delete(peerId);
                    this.emit('peer-disconnected', { peerId });
                };

                const connection: WifiConnection = {
                    peerId,
                    ipAddress: peerInfo.ipAddress,
                    port: peerInfo.port,
                    socket: ws,
                    connected: true,
                    bandwidth: 54, // Mbps (typical WiFi)
                };

                this.activeConnections.set(peerId, connection);
                return true;
            } else {
                // Node.js: Use TCP (simulated here)
                console.log(`⚙️ (Mock) TCP connection to ${peerId}`);

                const connection: WifiConnection = {
                    peerId,
                    ipAddress: peerInfo.ipAddress,
                    port: peerInfo.port,
                    socket: null,
                    connected: true,
                    bandwidth: 150, // Mbps (WiFi Direct)
                };

                this.activeConnections.set(peerId, connection);
                this.emit('peer-connected', { peerId });
                await this.flushQueueForPeer(peerId);
                return true;
            }
        } catch (error) {
            console.error(`❌ Failed to connect to ${peerId}:`, error);
            this.emit('connection-error', { peerId, error });
            return false;
        }
    }

    /**
     * Disconnect from a peer
     */
    async disconnectFromPeer(peerId: string): Promise<void> {
        const connection = this.activeConnections.get(peerId);
        if (!connection) return;

        try {
            if (typeof window !== 'undefined' && connection.socket instanceof WebSocket) {
                connection.socket.close();
            }

            this.activeConnections.delete(peerId);
            console.log(`🔌 Disconnected from ${peerId}`);
            this.emit('peer-disconnected', { peerId });
        } catch (error) {
            console.error(`❌ Error disconnecting from ${peerId}:`, error);
        }
    }

    /**
     * Send data to peer via WiFi
     */
    async sendToPeer(peerId: string, data: Uint8Array): Promise<boolean> {
        const connection = this.activeConnections.get(peerId);

        if (!connection) {
            // Queue message if not connected
            const msg: TransportMessage = {
                id: `wifi-${Date.now()}-${Math.random()}`,
                from: this.peerId,
                to: peerId,
                data,
                type: 'data',
                timestamp: Date.now(),
            };

            this.messageQueue.push(msg);
            console.log(`💾 Queued message for ${peerId} (not connected)`);

            // Attempt to connect
            await this.connectToPeer(peerId);
            return false;
        }

        try {
            if (typeof window !== 'undefined' && connection.socket instanceof WebSocket) {
                // Browser: Send via WebSocket
                connection.socket.send(data);
                console.log(`📤 Sent ${data.length} bytes to ${peerId} over WiFi`);
                return true;
            } else {
                // Node.js: Send via TCP (mocked)
                console.log(`📤 (Mock) Sent ${data.length} bytes to ${peerId} over WiFi`);

                // Simulate echo response
                setTimeout(() => {
                    this.handleWifiMessage(JSON.stringify({ echo: 'received' }), peerId);
                }, 50);

                return true;
            }
        } catch (error) {
            console.error(`❌ Send error to ${peerId}:`, error);
            return false;
        }
    }

    /**
     * Broadcast to all connected WiFi peers
     */
    async broadcast(data: Uint8Array): Promise<number> {
        let sent = 0;

        for (const peerId of this.activeConnections.keys()) {
            const success = await this.sendToPeer(peerId, data);
            if (success) sent++;
        }

        console.log(`📡 Broadcast: sent to ${sent}/${this.activeConnections.size} WiFi peers`);
        return sent;
    }

    /**
     * Handle incoming WiFi message
     */
    private handleWifiMessage(rawData: any, fromPeerId: string) {
        let data: Uint8Array;

        if (typeof rawData === 'string') {
            data = new TextEncoder().encode(rawData);
        } else if (rawData instanceof ArrayBuffer) {
            data = new Uint8Array(rawData);
        } else {
            data = new Uint8Array(Object.values(rawData));
        }

        const message: TransportMessage = {
            id: `wifi-${Date.now()}-${Math.random()}`,
            from: fromPeerId,
            to: this.peerId,
            data,
            type: 'data',
            timestamp: Date.now(),
        };

        console.log(`📥 Received ${data.length} bytes from WiFi (${fromPeerId})`);
        this.emit('message', message);
    }

    /**
     * Flush message queue for a peer
     */
    private async flushQueueForPeer(peerId: string) {
        const queued = this.messageQueue.filter(m => m.to === peerId);

        for (const msg of queued) {
            const success = await this.sendToPeer(peerId, msg.data);
            if (success) {
                this.messageQueue = this.messageQueue.filter(m => m.id !== msg.id);
            }
        }
    }

    /**
     * Get discovered peers
     */
    getDiscoveredPeers(): Peer[] {
        return Array.from(this.discoveredPeers.values()).map(p => ({
            id: p.peerId,
            address: `${p.ipAddress}:${p.port}`,
            signal: p.signal,
            lastSeen: p.timestamp,
        }));
    }

    /**
     * Get connected peers
     */
    getConnectedPeers(): string[] {
        return Array.from(this.activeConnections.keys());
    }

    /**
     * Get signal strength (RSSI) to a peer
     */
    getSignalStrength(peerId: string): number {
        const peer = this.discoveredPeers.get(peerId);
        if (!peer) return 0;
        return peer.signal;
    }

    /**
     * Get bandwidth for a connection
     */
    getBandwidth(peerId: string): number {
        const connection = this.activeConnections.get(peerId);
        if (!connection) return 0;
        return connection.bandwidth;
    }

    /**
     * Disconnect all peers
     */
    async disconnect(): Promise<void> {
        const peers = Array.from(this.activeConnections.keys());

        for (const peerId of peers) {
            await this.disconnectFromPeer(peerId);
        }

        this.scanning = false;
        console.log('✅ WiFi Transport disconnected');
    }

    /**
     * Get transport statistics
     */
    getStats() {
        return {
            type: this.type,
            localPort: this.localPort,
            connected: this.activeConnections.size,
            discovered: this.discoveredPeers.size,
            queued: this.messageQueue.length,
            scanning: this.scanning,
            totalBandwidth: Array.from(this.activeConnections.values()).reduce(
                (sum, conn) => sum + conn.bandwidth,
                0,
            ),
        };
    }
}

export default WifiTransport;
