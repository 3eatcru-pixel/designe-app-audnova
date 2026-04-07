/**
 * AudNova V22.0 - BLE Transport Layer
 * Bluetooth Low Energy (BLE) mesh transport for peer discovery + data sync
 * Extends MeshTransport with real BLE capabilities
 */

import { MeshTransport, TransportMessage, Peer } from './MeshTransport';

/**
 * BLE Peripheral Advertisement Data
 */
interface BleAdvertisement {
    peerId: string;
    signal: number;
    distance: number;
    timestamp: number;
    services: string[];
}

/**
 * BLE Connection State
 */
interface BleConnection {
    peerId: string;
    characteristic: any; // BluetoothRemoteGATTCharacteristic
    connected: boolean;
    rssi: number;
    mtu: number;
}

/**
 * BleTransport - Bluetooth Low Energy mesh transport
 * Uses Web Bluetooth API for cross-device communication
 * Falls back to mocked BLE for demo/testing
 */
export class BleTransport extends MeshTransport {
    private localDevice: any = null;
    private activeConnections: Map<string, BleConnection> = new Map();
    private discoveredPeers: Map<string, BleAdvertisement> = new Map();
    private scanning: boolean = false;
    private messageQueue: TransportMessage[] = [];

    // BLE Service/Characteristic UUIDs
    private readonly AETHER_SERVICE_UUID = '0000fee0-0000-1000-8000-00805f9b34fb';
    private readonly MESH_DATA_CHAR_UUID = '0000fee1-0000-1000-8000-00805f9b34fb';
    private readonly PEER_ID_CHAR_UUID = '0000fee2-0000-1000-8000-00805f9b34fb';
    private readonly SIGNAL_STRENGTH_CHAR_UUID = '0000fee3-0000-1000-8000-00805f9b34fb';

    constructor() {
        super('ble', 'Bluetooth Low Energy');
        this.initiateBleStack();
    }

    /**
     * Initialize BLE stack (Web Bluetooth API or mock)
     */
    private initiateBleStack() {
        if ('bluetooth' in navigator) {
            console.log('✅ Web Bluetooth API available');
        } else {
            console.log('⚠️ Web Bluetooth API not available - using mock BLE');
        }
    }

    /**
     * Start scanning for nearby BLE peers
     */
    async startScanning(): Promise<void> {
        if (this.scanning) return;
        this.scanning = true;

        console.log('📡 BLE: Starting scan...');

        try {
            if ('bluetooth' in navigator) {
                // Real BLE scan using Web Bluetooth API
                const device = await (navigator as any).bluetooth.requestDevice({
                    filters: [{ services: [this.AETHER_SERVICE_UUID] }],
                    optionalServices: [this.AETHER_SERVICE_UUID],
                });

                console.log(`✅ Found BLE device: ${device.name}`);
                this.localDevice = device;

                // Connect and discover services
                const gatt = await device.gatt.connect();
                const service = await gatt.getPrimaryService(this.AETHER_SERVICE_UUID);
                const characteristics = await service.getCharacteristics();

                // Setup listeners for incoming messages
                for (const char of characteristics) {
                    if (char.uuid === this.MESH_DATA_CHAR_UUID) {
                        char.addEventListener('characteristicvaluechanged', (event: any) => {
                            this.handleBleMessage(event.target.value);
                        });
                        await char.startNotifications();
                    }
                }
            } else {
                // Mock BLE scan - simulate nearby peers
                this.simulateBleDiscovery();
            }
        } catch (error) {
            console.error('❌ BLE Scan error:', error);
            this.simulateBleDiscovery(); // Fallback to mock
        }
    }

    /**
     * Simulate BLE peer discovery for testing
     */
    private simulateBleDiscovery() {
        console.log('🎭 Simulating BLE discovery...');

        // Mock discovered peers
        const mockPeers: BleAdvertisement[] = [
            {
                peerId: 'ble-peer-1',
                signal: -45,
                distance: 5,
                timestamp: Date.now(),
                services: [this.AETHER_SERVICE_UUID],
            },
            {
                peerId: 'ble-peer-2',
                signal: -65,
                distance: 15,
                timestamp: Date.now(),
                services: [this.AETHER_SERVICE_UUID],
            },
            {
                peerId: 'ble-peer-3',
                signal: -80,
                distance: 25,
                timestamp: Date.now(),
                services: [this.AETHER_SERVICE_UUID],
            },
        ];

        for (const peer of mockPeers) {
            this.discoveredPeers.set(peer.peerId, peer);
            this.notifyDiscovery({
                id: peer.peerId,
                address: `ble:${peer.peerId}`,
                signal: peer.signal,
                lastSeen: peer.timestamp,
            });
        }

        // Emit discovery event
        this.emit('scan-complete', {
            found: mockPeers.length,
            peers: mockPeers.map(p => p.peerId),
        });
    }

    /**
     * Stop scanning
     */
    async stopScanning(): Promise<void> {
        this.scanning = false;
        console.log('🛑 BLE: Scanning stopped');
    }

    /**
     * Connect to a specific BLE peer
     */
    async connectToPeer(peerId: string): Promise<boolean> {
        if (this.activeConnections.has(peerId)) {
            console.log(`✅ Already connected to ${peerId}`);
            return true;
        }

        console.log(`🔗 Connecting to BLE peer: ${peerId}`);

        try {
            if ('bluetooth' in navigator) {
                // Real BLE connection
                const device = await (navigator as any).bluetooth.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: [this.AETHER_SERVICE_UUID],
                });

                const gatt = await device.gatt.connect();
                const service = await gatt.getPrimaryService(this.AETHER_SERVICE_UUID);
                const characteristic = await service.getCharacteristic(this.MESH_DATA_CHAR_UUID);

                const connection: BleConnection = {
                    peerId,
                    characteristic,
                    connected: true,
                    rssi: -50,
                    mtu: 512,
                };

                this.activeConnections.set(peerId, connection);

                // Listen for incoming messages
                characteristic.addEventListener('characteristicvaluechanged', (event: any) => {
                    this.handleBleMessage(event.target.value, peerId);
                });
                await characteristic.startNotifications();

                console.log(`✅ Connected to ${peerId}`);
                this.emit('peer-connected', { peerId });

                // Flush message queue for this peer
                await this.flushQueueForPeer(peerId);

                return true;
            } else {
                // Mock BLE connection
                const connection: BleConnection = {
                    peerId,
                    characteristic: null,
                    connected: true,
                    rssi: -55,
                    mtu: 512,
                };

                this.activeConnections.set(peerId, connection);
                console.log(`✅ (Mock) Connected to ${peerId}`);
                this.emit('peer-connected', { peerId });

                // Flush queue
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
            if (connection.characteristic && 'stopNotifications' in connection.characteristic) {
                await connection.characteristic.stopNotifications();
            }

            this.activeConnections.delete(peerId);
            console.log(`🔌 Disconnected from ${peerId}`);
            this.emit('peer-disconnected', { peerId });
        } catch (error) {
            console.error(`❌ Error disconnecting from ${peerId}:`, error);
        }
    }

    /**
     * Send data to a peer over BLE
     */
    async sendToPeer(peerId: string, data: Uint8Array): Promise<boolean> {
        const connection = this.activeConnections.get(peerId);

        if (!connection) {
            // Queue message if not connected yet
            const msg: TransportMessage = {
                id: `ble-${Date.now()}-${Math.random()}`,
                from: this.peerId,
                to: peerId,
                data,
                type: 'data',
                timestamp: Date.now(),
            };

            this.messageQueue.push(msg);
            console.log(`💾 Queued message for ${peerId} (not connected yet)`);

            // Try to connect
            await this.connectToPeer(peerId);
            return false; // Message queued, will be sent on connect
        }

        try {
            if ('bluetooth' in navigator && connection.characteristic) {
                // Split large messages into MTU-sized chunks
                const mtu = connection.mtu - 3; // 3 bytes header
                for (let i = 0; i < data.length; i += mtu) {
                    const chunk = data.slice(i, i + mtu);
                    await connection.characteristic.writeValue(chunk);
                }

                console.log(`📤 Sent ${data.length} bytes to ${peerId} over BLE`);
                return true;
            } else {
                // Mock BLE send
                console.log(`📤 (Mock) Sent ${data.length} bytes to ${peerId} over BLE`);

                // Simulate receiving response
                setTimeout(() => {
                    this.handleBleMessage(data, peerId);
                }, 100);

                return true;
            }
        } catch (error) {
            console.error(`❌ Send error to ${peerId}:`, error);
            return false;
        }
    }

    /**
     * Broadcast data to all connected peers
     */
    async broadcast(data: Uint8Array): Promise<number> {
        let sent = 0;

        for (const peerId of this.activeConnections.keys()) {
            const success = await this.sendToPeer(peerId, data);
            if (success) sent++;
        }

        console.log(`📡 Broadcast: sent to ${sent}/${this.activeConnections.size} peers`);
        return sent;
    }

    /**
     * Handle incoming BLE message
     */
    private handleBleMessage(value: ArrayBuffer, fromPeerId?: string) {
        const data = new Uint8Array(value);

        const message: TransportMessage = {
            id: `ble-${Date.now()}-${Math.random()}`,
            from: fromPeerId || 'ble-unknown',
            to: this.peerId,
            data,
            type: 'data',
            timestamp: Date.now(),
        };

        console.log(`📥 Received ${data.length} bytes from BLE`);
        this.emit('message', message);
    }

    /**
     * Flush queued messages for a peer
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
     * Get list of discovered peers
     */
    getDiscoveredPeers(): Peer[] {
        return Array.from(this.discoveredPeers.values()).map(p => ({
            id: p.peerId,
            address: `ble:${p.peerId}`,
            signal: p.signal,
            lastSeen: p.timestamp,
        }));
    }

    /**
     * Get connection status
     */
    getConnectedPeers(): string[] {
        return Array.from(this.activeConnections.keys());
    }

    /**
     * Get signal strength to a peer
     */
    getSignalStrength(peerId: string): number {
        const connection = this.activeConnections.get(peerId);
        if (!connection) return 0;
        return connection.rssi;
    }

    /**
     * Disconnect all peers and cleanup
     */
    async disconnect(): Promise<void> {
        const peers = Array.from(this.activeConnections.keys());

        for (const peerId of peers) {
            await this.disconnectFromPeer(peerId);
        }

        this.scanning = false;
        console.log('✅ BLE Transport disconnected');
    }

    /**
     * Get transport statistics
     */
    getStats() {
        return {
            type: this.type,
            connected: this.activeConnections.size,
            discovered: this.discoveredPeers.size,
            queued: this.messageQueue.length,
            scanning: this.scanning,
        };
    }
}

export default BleTransport;
