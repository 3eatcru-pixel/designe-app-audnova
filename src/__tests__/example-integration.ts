/**
 * AudNova V22.0 - Exemplo Completo de Integração
 * Fluxo: Bootstrap → Mesh → Identity → Radio → E2EE → Audio
 * Baseado na engenharia Aether Elite V10.8.2
 */

import { CryptoService } from '../services/CryptoService';
import { IdentityService } from '../services/IdentityService';
import { StorageService } from '../services/StorageService';
import { AudioService } from '../services/AudioService';
import { RatchetService } from '../services/RatchetService';
import { MeshEngine } from '../core/mesh/MeshEngine';
import { GossipEngine } from '../core/mesh/GossipEngine';
import { RadioService } from '../services/RadioService';
import { MockTransport } from '../core/transport/MeshTransport';

/**
 * AudNovaNode - Classe que orquestra todos os serviços
 * Representa um nó da rede que pode:
 * - Estabelecer identidade com seeds BIP39
 * - Conectar ao mesh P2P via BLE/WiFi/TCP
 * - Sincronizar estado via gossip
 * - Transmitir áudio em canais
 * - Encriptar E2EE com Double Ratchet
 */
export class AudNovaNode {
    private nodeId: string;
    private crypto: CryptoService;
    private identity: IdentityService;
    private storage: StorageService;
    private audio: AudioService;
    private transport: MockTransport; // Em produção: BleTransport, WiFiTransport, TcpTransport
    private meshEngine: MeshEngine;
    private gossipEngine: GossipEngine;
    private radioService: RadioService;
    private ratchetService: RatchetService;

    private isInitialized: boolean = false;

    constructor(nodeId: string) {
        this.nodeId = nodeId;
        console.log(`[NODE] Initializing AudNova node: ${nodeId}`);

        // Instanciar serviços
        this.crypto = new CryptoService();
        this.identity = new IdentityService();
        this.storage = new StorageService(this.crypto);
        this.audio = new AudioService();
        this.transport = new MockTransport(nodeId);
        this.meshEngine = new MeshEngine(this.transport, this.crypto);
        this.gossipEngine = new GossipEngine(this.meshEngine, nodeId, this.crypto);
        this.radioService = new RadioService(this.meshEngine, this.audio, this.crypto);
        this.ratchetService = new RatchetService(nodeId, this.crypto, this.storage);
    }

    // =========================================================================
    // BOOTSTRAP - Inicializa identidade e conecta ao mesh
    // =========================================================================

    /**
     * Bootstrap com nova seed
     * Cria identidade, deriva chaves, inicializa storage
     */
    async bootstrapNewIdentity(): Promise<{ mnemonic: string; password: string }> {
        console.log(`[${this.nodeId}] Bootstrapping with new identity...`);

        // Gerar seed
        const seed = await this.identity.generateNewSeed();
        console.log(`[${this.nodeId}] Generated seed: ${seed.mnemonic}`);

        // Criar DID assinado
        const did = await this.identity.createDIDFromSeed(seed);
        console.log(`[${this.nodeId}] Created DID: ${did.id}`);

        // Setup master key no storage (derivado da seed)
        const masterKey = seed.masterKey;
        await this.storage.setMasterKey(masterKey);

        // Mark sensitive keys para criptografia automática
        await this.storage.markAsEncrypted('SEED');
        await this.storage.markAsEncrypted('DID');
        await this.storage.markAsEncrypted('SESSION_KEYS');

        // Persistir seed e DID
        await this.storage.set('SEED', seed);
        await this.storage.set('DID', did);

        // Password é para acesso local (não armazenado)
        const password = `${this.nodeId}-password-${Date.now()}`;

        console.log(`[${this.nodeId}] Identity bootstrapped ✅`);
        return { mnemonic: seed.mnemonic, password };
    }

    /**
     * Bootstrap com seed existente
     * Recupera identidade do armazenamento
     */
    async bootstrapFromSeed(mnemonic: string): Promise<void> {
        console.log(`[${this.nodeId}] Restoring from seed...`);

        const restoreInfo = {
            mnemonic,
            passphrase: '', // BIP39 passphrase (opcional)
        };

        // Restaurar identidade (esta função retornaria um SeedIdentity)
        // const seed = await this.identity.restoreFromSeed(restoreInfo);

        // Recuperar do storage
        const storedSeed = await this.storage.get('SEED');
        if (storedSeed) {
            const masterKey = (storedSeed as any).masterKey;
            await this.storage.setMasterKey(masterKey);
            console.log(`[${this.nodeId}] Identity restored from storage ✅`);
        }
    }

    /**
     * Conecta ao mesh P2P
     * Inicializa transport e registra uns peers
     */
    async connectToMesh(peerNodes: AudNovaNode[] = []): Promise<void> {
        console.log(`[${this.nodeId}] Connecting to mesh...`);

        // Inicializar transport
        await this.transport.init();

        // Registrar peers conhecidos
        for (const peer of peerNodes) {
            this.transport.registerPeer(
                peer.nodeId,
                peer.nodeId,
                'AUDNOVA_V22'
            );
            console.log(`[${this.nodeId}] Registered peer: ${peer.nodeId}`);
        }

        // Setup listeners
        this.setupMeshListeners();

        this.isInitialized = true;
        console.log(`[${this.nodeId}] Connected to mesh with ${peerNodes.length} peers ✅`);
    }

    private setupMeshListeners(): void {
        // Registrar handler para packets de gossip
        this.meshEngine.onPacket((packet) => {
            if (packet.metadata.type === 'GOSSIP_PUSH') {
                console.log(`[${this.nodeId}] Received gossip push from ${packet.metadata.sender}`);
            }
        });

        // Registrar handler para audio
        this.radioService.onAudio((segment, fromPeerId) => {
            console.log(`[${this.nodeId}] Received audio from ${fromPeerId}, seq=${segment.sequence}`);
        });

        // Registrar handler para mudanças de canal
        this.radioService.onChannelChange((channel) => {
            if (channel) {
                console.log(`[${this.nodeId}] Switched to channel: ${channel.name} (${channel.participants.size} participants)`);
            }
        });
    }

    // =========================================================================
    // RADIO - Criar canais e transmitir áudio
    // =========================================================================

    /**
     * Cria novo canal de áudio
     */
    async createRadioChannel(channelName: string): Promise<string> {
        const channel = await this.radioService.createChannel(channelName, true); // encrypted
        console.log(`[${this.nodeId}] Created radio channel: ${channel.name} (${channel.id})`);
        return channel.id;
    }

    /**
     * Join a um canal existente
     */
    async joinRadioChannel(channelId: string): Promise<void> {
        const channel = await this.radioService.joinChannel(channelId);
        console.log(`[${this.nodeId}] Joined channel: ${channel.name} with ${channel.participants.size} participants`);
    }

    /**
     * Inicia transmissão de áudio
     */
    async startAudioTransmission(sampleRate: number = 48000): Promise<void> {
        const activeChannel = this.radioService.getActiveChannel();
        if (!activeChannel) {
            throw new Error('No active radio channel. Join a channel first.');
        }

        this.radioService.startTransmission(sampleRate);
        console.log(`[${this.nodeId}] Audio transmission started on ${activeChannel.name}`);
    }

    /**
     * Para transmissão de áudio
     */
    stopAudioTransmission(): void {
        this.radioService.stopTransmission();
        console.log(`[${this.nodeId}] Audio transmission stopped`);
    }

    // =========================================================================
    // E2EE - Conversa encriptada com peer
    // =========================================================================

    /**
     * Inicia sessão E2EE com peer
     * Realiza ECDH handshake e setup de ratchet
     */
    async initiateSecureChat(peerId: string, peerPublicKey: Uint8Array): Promise<string> {
        console.log(`[${this.nodeId}] Initiating secure chat with ${peerId}...`);

        // Setup ratchet session
        const session = await this.ratchetService.initializeSession(peerId, peerPublicKey);

        console.log(`[${this.nodeId}] Secure session established: ${session.sessionId}`);
        return session.sessionId;
    }

    /**
     * Envia mensagem encriptada
     */
    async sendSecureMessage(sessionId: string, message: string): Promise<void> {
        const plaintext = new TextEncoder().encode(message);
        const encrypted = await this.ratchetService.encryptMessage(sessionId, plaintext);

        console.log(`[${this.nodeId}] Encrypted message seq=${encrypted.header.messageNumber}:`);
        console.log(`    → Ciphertext: ${encrypted.ciphertext.length} bytes`);
        console.log(`    → DH ephemeral: ${encrypted.header.dh.length} bytes`);

        // Em produção: enviar via MeshEngine.unicast()
        // await this.meshEngine.unicast(encryptedPacket, peerId);
    }

    /**
     * Recebe e decripta mensagem
     */
    async receiveSecureMessage(sessionId: string, encrypted: any): Promise<string> {
        const plaintext = await this.ratchetService.decryptMessage(sessionId, encrypted);
        const message = new TextDecoder().decode(plaintext);

        console.log(`[${this.nodeId}] Decrypted message: ${message}`);
        return message;
    }

    // =========================================================================
    // MESH - Gossip sync e networking
    // =========================================================================

    /**
     * Verifica status de convergência da rede
     */
    getNetworkStatus(): any {
        const convergence = this.gossipEngine.getConvergenceStatus();
        const peers = this.transport.getPeers();
        const routes = this.meshEngine.getNetworkMap();

        return {
            nodeId: this.nodeId,
            connectedPeers: peers.length,
            convergence: `${convergence.percentage.toFixed(1)}%`,
            routes: routes.length,
            isInitialized: this.isInitialized,
        };
    }

    /**
     * Lista todos os canais de rádio disponíveis
     */
    listRadioChannels(): any[] {
        return this.radioService.listChannels().map((ch) => ({
            id: ch.id,
            name: ch.name,
            participants: ch.participants.size,
            encrypted: ch.isEncrypted,
        }));
    }

    /**
     * Limpa recursos e desconecta
     */
    async shutdown(): Promise<void> {
        console.log(`[${this.nodeId}] Shutting down...`);

        this.radioService.stopTransmission();
        this.radioService.cleanup();

        await this.transport.shutdown();

        this.isInitialized = false;
        console.log(`[${this.nodeId}] Shutdown complete ✅`);
    }
}

// ============================================================================
// EXAMPLE USAGE - Fluxo completo
// ============================================================================

export async function demonstrateAudNovaFlow(): Promise<void> {
    console.log('\n' + '='.repeat(70));
    console.log('🎙️  AudNova V22.0 - Complete Integration Demo');
    console.log('='.repeat(70) + '\n');

    // Criar 2 nós
    const alice = new AudNovaNode('alice');
    const bob = new AudNovaNode('bob');

    try {
        // ===== PARTE 1: Identity Bootstrap =====
        console.log('\n--- Part 1: Identity Bootstrap ---');
        const aliceIdentity = await alice.bootstrapNewIdentity();
        const bobIdentity = await bob.bootstrapNewIdentity();

        console.log(`Alice seed (KEEP SECRET): ${aliceIdentity.mnemonic}`);
        console.log(`Bob seed (KEEP SECRET): ${bobIdentity.mnemonic}`);

        // ===== PARTE 2: Connect to Mesh =====
        console.log('\n--- Part 2: Connect to Mesh ---');
        await alice.connectToMesh([bob]);
        await bob.connectToMesh([alice]);

        // ===== PARTE 3: Create Radio Channel =====
        console.log('\n--- Part 3: Create Radio Channel ---');
        const channelId = await alice.createRadioChannel('General Chat');
        await bob.joinRadioChannel(channelId);

        // ===== PARTE 4: Audio Transmission =====
        console.log('\n--- Part 4: Audio Transmission ---');
        await alice.startAudioTransmission();
        await new Promise((r) => setTimeout(r, 500)); // Simulate 500ms transmission
        alice.stopAudioTransmission();

        // ===== PARTE 5: Secure Chat (E2EE) =====
        console.log('\n--- Part 5: Secure Chat (E2EE) ---');

        // Em produção: trocar public keys via handshake
        const bobPublicKey = new Uint8Array(65); // Simulated
        const sessionId = await alice.initiateSecureChat('bob', bobPublicKey);

        await alice.sendSecureMessage(sessionId, 'Hello Bob! This is encrypted with Double Ratchet.');
        await alice.sendSecureMessage(sessionId, 'Forward secrecy is enabled - old keys are deleted.');

        // ===== PARTE 6: Network Status =====
        console.log('\n--- Part 6: Network Status ---');
        console.log('Alice status:', alice.getNetworkStatus());
        console.log('Bob status:', bob.getNetworkStatus());

        console.log('Alice channels:', alice.listRadioChannels());
        console.log('Bob channels:', bob.listRadioChannels());

        // ===== PARTE 7: Cleanup =====
        console.log('\n--- Part 7: Shutdown ---');
        await alice.shutdown();
        await bob.shutdown();

        console.log('\n' + '='.repeat(70));
        console.log('✅ Demo Complete - All services working!');
        console.log('='.repeat(70) + '\n');
    } catch (err) {
        console.error('❌ Demo error:', err);
        await alice.shutdown().catch(() => { });
        await bob.shutdown().catch(() => { });
    }
}

// Export para uso em testes ou CLI
export default {
    AudNovaNode,
    demonstrateAudNovaFlow,
};
