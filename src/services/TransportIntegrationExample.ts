/**
 * Transport Integration Example
 * How to use BLE/WiFi transports in AudNovaNode
 */

import { TransportManager, SelectionStrategy } from '../services/TransportManager';
import { MeshEngine } from '../services/MeshEngine';
import { CryptoService } from '../services/CryptoService';
import { IdentityService } from '../services/IdentityService';

/**
 * Example: AudNovaNode with Real Transports
 */
export class AudNovaNodeWithTransports {
    private transportManager: TransportManager;
    private meshEngine: MeshEngine;
    private cryptoService: CryptoService;
    private identityService: IdentityService;
    private peerId: string;

    constructor(strategy: SelectionStrategy = SelectionStrategy.HYBRID) {
        this.cryptoService = new CryptoService();
        this.identityService = new IdentityService(this.cryptoService);
        this.transportManager = new TransportManager(strategy);
        this.meshEngine = new MeshEngine(this.transportManager as any); // Type adaptation
        this.peerId = this.identityService.generateIdentity().peerId;
    }

    /**
     * Initialize the node with real transports
     */
    async initialize(): Promise<void> {
        console.log(`🚀 Initializing AudNova Node (${this.peerId})`);

        try {
            // Initialize transports (BLE, WiFi, Mock)
            await this.transportManager.initializeTransports();
            console.log('✅ Transports initialized');

            // Setup event listeners
            this.setupTransportListeners();

            // Wait for peer discovery
            await this.waitForDiscovery();

            console.log('✅ Node ready');
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Setup listeners for transport events
     */
    private setupTransportListeners(): void {
        this.transportManager.on('message', (msg: any) => {
            console.log(`📬 Message from ${msg.from}:`, msg.data.length, 'bytes');
            this.meshEngine.handleIncomingMessage(msg);
        });

        this.transportManager.on('peer-connected', (data: any) => {
            console.log(`🔗 Peer connected via ${data.transport}: ${data.peerId}`);
        });

        this.transportManager.on('peer-disconnected', (data: any) => {
            console.log(`🔌 Peer disconnected: ${data.peerId}`);
        });
    }

    /**
     * Wait for initial peer discovery
     */
    private waitForDiscovery(maxWait: number = 5000): Promise<void> {
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                console.log('⏱️ Discovery timeout - proceeding with available peers');
                resolve();
            }, maxWait);

            const checkPeers = () => {
                const peers = this.transportManager.getActivePeers();
                if (peers.length > 0) {
                    clearTimeout(timer);
                    console.log(`✅ Found ${peers.length} peers`);
                    resolve();
                }
            };

            // Check every 500ms
            const interval = setInterval(checkPeers, 500);
            setTimeout(() => clearInterval(interval), maxWait);
        });
    }

    /**
     * Send message to a peer using best available transport
     */
    async sendToPeer(peerId: string, message: string): Promise<boolean> {
        const data = new TextEncoder().encode(message);
        const success = await this.transportManager.sendToPeer(peerId, data);

        if (success) {
            console.log(`📤 Sent to ${peerId}: ${message}`);
        } else {
            console.log(`❌ Failed to send to ${peerId}`);
        }

        return success;
    }

    /**
     * Broadcast to all peers
     */
    async broadcast(message: string): Promise<number> {
        const data = new TextEncoder().encode(message);
        const count = await this.transportManager.broadcast(data);
        console.log(`📡 Broadcast to ${count} peers: ${message}`);
        return count;
    }

    /**
     * Get network metrics
     */
    getMetrics() {
        return this.transportManager.getMetrics();
    }

    /**
     * Get discovered peers
     */
    getDiscoveredPeers() {
        return this.transportManager.getActivePeers();
    }

    /**
     * Join a specific transport
     */
    async joinTransport(transportType: 'ble' | 'wifi'): Promise<void> {
        // Implementation for explicit transport selection
        console.log(`📍 Attempting to join ${transportType} network...`);
        // This would integrate with the specific transport's connection logic
    }

    /**
     * Cleanup and disconnect
     */
    async disconnect(): Promise<void> {
        console.log('🔌 Disconnecting...');
        await this.transportManager.disconnect();
        console.log('✅ Disconnected');
    }
}

/**
 * USAGE EXAMPLE
 */
export async function demonstrateTransports() {
    console.log('='.repeat(60));
    console.log('AudNova BLE/WiFi Transport Demonstration');
    console.log('='.repeat(60));

    // Create node with HYBRID strategy (recommended for resilience)
    const node = new AudNovaNodeWithTransports(SelectionStrategy.HYBRID);

    try {
        // Initialize
        await node.initialize();

        // Get metrics
        const metrics = node.getMetrics();
        console.log('\n📊 Network Metrics:');
        console.log(JSON.stringify(metrics, null, 2));

        // Get discovered peers
        const peers = node.getDiscoveredPeers();
        console.log('\n👥 Discovered Peers:');
        peers.forEach(peer => {
            console.log(
                `  - ${peer.id} (${peer.address}) Signal: ${peer.signal}dBm`,
            );
        });

        // Send to first peer if available
        if (peers.length > 0) {
            const firstPeerId = peers[0].id;
            await node.sendToPeer(
                firstPeerId,
                'Hello from AudNova with real transports!',
            );
        }

        // Broadcast to all
        await node.broadcast('AudNova mesh network is active!');

        // Keep running for 10 seconds to receive messages
        console.log('\n⏳ Listening for 10 seconds...');
        await new Promise(resolve => setTimeout(resolve, 10000));
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        // Cleanup
        await node.disconnect();
    }
}

// Export for testing
export default { AudNovaNodeWithTransports, demonstrateTransports };
