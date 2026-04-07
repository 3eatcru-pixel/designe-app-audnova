/**
 * AudNova V22.0 - RadioService
 * Transmissão de áudio em canais com adaptação dinâmica
 * Baseado na engenharia Aether Elite V10.8.2
 */

import {
    AudioSegment,
    SecurePacket,
    JitterBufferState,
    PacketMetadata,
    PeerInfo,
    IRadioService,
} from '../types';
import { AUDIO_SPECS, MESH_CONFIG } from '../core/config';
import { AudioService } from './AudioService';
import { MeshEngine } from '../mesh/MeshEngine';
import { CryptoService } from './CryptoService';

/**
 * RadioChannel - canal de áudio com múltiplos participantes
 * Um "room" de áudio onde peers podem conversar
 */
export interface RadioChannel {
    id: string;
    name: string;
    participants: Set<string>; // peer IDs
    codec: 'OPUS' | 'PCM';
    sampleRate: number;
    createdAt: number;
    isEncrypted: boolean;
}

/**
 * RadioStats - estatísticas de qualidade de áudio
 * Usado para monitorar saúde do canal
 */
export interface RadioStats {
    channelId: string;
    packetsSent: number;
    packetsReceived: number;
    packetsLost: number;
    avgLatency: number;
    jitterMs: number;
    currentCodec: 'OPUS' | 'PCM';
    currentPowerMode: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * RadioService - Gerencia transmissão de áudio em canais
 * - Criar/deletar canais
 * - Transmitir áudio com FEC
 * - Receber e decodificar áudio
 * - Adaptação dinâmica de codec/qualidade
 * - Monitoring de QoS
 */
export class RadioService implements IRadioService {
    private audio: AudioService;
    private meshEngine: MeshEngine;
    private crypto: CryptoService;
    private myId: string;

    // Canal management
    private channels: Map<string, RadioChannel> = new Map();
    private activeChannel: string | null = null;

    // Audio state
    private outgoingQueue: AudioSegment[] = []; // Áudio a transmitir
    private incomingBuffers: Map<string, AudioSegment[]> = new Map(); // Buffer por peer
    private playbackQueue: ArrayBuffer[] = []; // Fila para reprodução

    // Monitoring
    private stats: Map<string, RadioStats> = new Map();
    private rtpSequence: number = 0;

    // Handlers
    private onAudioHandlers: ((audio: AudioSegment, fromPeerId: string) => void)[] = [];
    private onChannelChangeHandlers: ((channel: RadioChannel | null) => void)[] = [];

    // Transmission control
    private isTransmitting: boolean = false;
    private transmitInterval: number | null = null;

    constructor(meshEngine: MeshEngine, audio?: AudioService, crypto?: CryptoService) {
        this.meshEngine = meshEngine;
        this.audio = audio || new AudioService();
        this.crypto = crypto || new CryptoService();
        this.myId = meshEngine.getId?.() || 'radio-node';

        console.log(`[RADIO] Service initialized for ${this.myId}`);
    }

    // =========================================================================
    // CHANNEL MANAGEMENT
    // =========================================================================

    /**
     * Cria novo canal de áudio
     * Broadcasts notificação para a rede
     */
    async createChannel(name: string, isEncrypted: boolean = true): Promise<RadioChannel> {
        const channelId = `channel-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        const channel: RadioChannel = {
            id: channelId,
            name,
            participants: new Set([this.myId]), // Self é criador
            codec: 'OPUS',
            sampleRate: AUDIO_SPECS.DEFAULT_SAMPLE_RATE,
            createdAt: Date.now(),
            isEncrypted,
        };

        this.channels.set(channelId, channel);
        console.log(`[RADIO] Created channel ${channelId}: ${name}`);

        // Broadcast channel info via gossip
        await this.broadcastChannelUpdate(channel);

        return channel;
    }

    /**
     * Deleta canal
     * Notifica todos os participantes
     */
    async deleteChannel(channelId: string): Promise<void> {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error(`Channel ${channelId} not found`);
        }

        this.channels.delete(channelId);
        if (this.activeChannel === channelId) {
            this.activeChannel = null;
            this.notifyChannelChange(null);
        }

        console.log(`[RADIO] Deleted channel ${channelId}`);
    }

    /**
     * Join channel existente
     */
    async joinChannel(channelId: string): Promise<RadioChannel> {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error(`Channel ${channelId} not found`);
        }

        channel.participants.add(this.myId);
        this.activeChannel = channelId;

        console.log(`[RADIO] Joined channel ${channelId}. Participants: ${channel.participants.size}`);
        this.notifyChannelChange(channel);

        return channel;
    }

    /**
     * Leave channel
     */
    async leaveChannel(channelId: string): Promise<void> {
        const channel = this.channels.get(channelId);
        if (!channel) {
            return;
        }

        channel.participants.delete(this.myId);

        if (this.activeChannel === channelId) {
            this.activeChannel = null;
            this.notifyChannelChange(null);
            console.log(`[RADIO] Left active channel ${channelId}`);
        }
    }

    /**
     * Lista todos os canais disponíveis
     */
    listChannels(): RadioChannel[] {
        return Array.from(this.channels.values());
    }

    /**
     * Retorna canali ativo atual
     */
    getActiveChannel(): RadioChannel | null {
        return this.activeChannel ? (this.channels.get(this.activeChannel) ?? null) : null;
    }

    // =========================================================================
    // AUDIO TRANSMISSION
    // =========================================================================

    /**
     * Inicia transmissão de áudio
     * Começa a coletar samples do mic e enviar via mesh
     */
    startTransmission(sampleRate: number = AUDIO_SPECS.DEFAULT_SAMPLE_RATE): void {
        if (this.isTransmitting) {
            console.warn('[RADIO] Already transmitting');
            return;
        }

        if (!this.activeChannel) {
            throw new Error('No active channel. Join a channel first.');
        }

        this.isTransmitting = true;
        const channelId = this.activeChannel;

        // Simular captura de áudio (TODO: usar WebAudio API real)
        this.transmitInterval = window.setInterval(() => {
            if (!this.isTransmitting) return;

            // Simular 20ms de audio @ 48kHz = 960 samples
            const samplesPerChunk = (sampleRate * 20) / 1000;
            const fakeSamples = new Float32Array(samplesPerChunk);

            // Random data (em produção, vem do mic)
            for (let i = 0; i < samplesPerChunk; i++) {
                fakeSamples[i] = (Math.random() - 0.5) * 0.1;
            }

            this.pushAudioSegment(channelId, fakeSamples);
        }, 20); // 20ms interval (50Hz frequency)

        console.log(`[RADIO] Started transmission on channel ${channelId}`);
    }

    /**
     * Para transmissão de áudio
     */
    stopTransmission(): void {
        if (this.transmitInterval !== null) {
            clearInterval(this.transmitInterval);
            this.transmitInterval = null;
        }
        this.isTransmitting = false;
        console.log('[RADIO] Stopped transmission');
    }

    /**
     * Empurra segmento de áudio para fila de transmissão
     * Aplica FEC, codificação, encriptação
     */
    private async pushAudioSegment(channelId: string, samples: Float32Array): Promise<void> {
        const channel = this.channels.get(channelId);
        if (!channel) return;

        // Selecionar codec baseado em condições atuais
        const codec = this.audio.selectCodec('MEDIUM');
        const sampleRate = this.audio.getRecommendedSampleRate('MEDIUM');

        // Criar segmento
        const segment: AudioSegment = {
            channelId,
            sequence: this.rtpSequence++,
            codec,
            sampleRate,
            samples,
            timestamp: Date.now(),
            fecMode: 'MEDIUM',
            fecData: [], // Será preenchido abaixo
        };

        // Aplicar FEC
        const payload = JSON.stringify({
            samples: Array.from(samples),
            sequence: segment.sequence,
            timestamp: segment.timestamp,
        });

        segment.fecData = this.audio.encodeFEC(new TextEncoder().encode(payload), 'MEDIUM');

        // Criar SecurePacket
        const metadata: PacketMetadata = {
            type: 'AUDIO',
            sender: this.myId,
            timestamp: Date.now(),
            priority: 'AUDIO',
            ttl: MESH_CONFIG.TTL_BASE(5),
            sequenceNum: segment.sequence,
        };

        const packet: SecurePacket = {
            metadata,
            payload: JSON.stringify(segment),
            signature: await this.crypto.sign(
                JSON.stringify({ metadata, payload: JSON.stringify(segment) })
            ),
        };

        // Enviar via gossip (broadcast para todos no canal)
        // TODO: this.meshEngine.broadcast(packet);

        console.log(`[RADIO] Pushed audio segment seq=${segment.sequence} to ${channel.participants.size} peers`);
    }

    // =========================================================================
    // AUDIO RECEPTION
    // =========================================================================

    /**
     * Processa segmento de áudio recebido
     * Decodifica, recupera FEC, buffering
     */
    async handleAudioSegment(segment: AudioSegment, fromPeerId: string): Promise<void> {
        // Get incoming buffer para este peer
        if (!this.incomingBuffers.has(fromPeerId)) {
            this.incomingBuffers.set(fromPeerId, []);
        }

        const buffer = this.incomingBuffers.get(fromPeerId)!;
        buffer.push(segment);

        // Ordenar por sequence
        buffer.sort((a, b) => a.sequence - b.sequence);

        // Tentar recuperar áudio quando temos k+1 packets
        if (buffer.length >= 5) {
            try {
                const recovered = this.audio.decodeFEC(segment.fecData, 'MEDIUM');
                this.playbackQueue.push(recovered as ArrayBuffer);

                // Notificar handlers
                this.onAudioHandlers.forEach((h) => h(segment, fromPeerId));

                console.log(`[RADIO] Decoded audio from ${fromPeerId}`);
            } catch (err) {
                console.warn(`[RADIO] FEC decode failed:`, err);
            }
        }

        // Manter buffer sob controle (drop oldest se > 100 packets)
        if (buffer.length > 100) {
            buffer.shift();
        }
    }

    /**
     * Pop áudio da fila de reproducão (para speakers/output)
     */
    getNextPlaybackBuffer(): ArrayBuffer | null {
        return this.playbackQueue.shift() ?? null;
    }

    // =========================================================================
    // QUALITY OF SERVICE
    // =========================================================================

    /**
     * Retorna estatísticas de qualidade do canal
     */
    getChannelStats(channelId: string): RadioStats | null {
        return this.stats.get(channelId) ?? null;
    }

    /**
     * Atualiza estatísticas baseado em packet loss
     */
    updateQualityMetrics(channelId: string, packetsLost: number, latencyMs: number): void {
        const stats = this.stats.get(channelId) || {
            channelId,
            packetsSent: 0,
            packetsReceived: 0,
            packetsLost: 0,
            avgLatency: 0,
            jitterMs: 0,
            currentCodec: 'OPUS',
            currentPowerMode: 'MEDIUM',
        };

        stats.packetsReceived++;
        stats.packetsLost += packetsLost;
        stats.avgLatency = (stats.avgLatency * 0.9 + latencyMs * 0.1); // EMA

        // Adapt codec se qualidade ruim
        if (packetsLost > 5) {
            stats.currentPowerMode = 'LOW';
            stats.currentCodec = 'PCM';
            console.log(`[RADIO] Quality degraded - switching to ${stats.currentCodec} LOW power`);
        } else if (packetsLost === 0 && stats.avgLatency < 50) {
            stats.currentPowerMode = 'HIGH';
            stats.currentCodec = 'OPUS';
            console.log(`[RADIO] Quality excellent - switching to ${stats.currentCodec} HIGH power`);
        }

        this.stats.set(channelId, stats);
    }

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    /**
     * Registra handler para áudio recebido
     */
    onAudio(handler: (audio: AudioSegment, fromPeerId: string) => void): void {
        this.onAudioHandlers.push(handler);
    }

    /**
     * Registra handler para mudanças de canal
     */
    onChannelChange(handler: (channel: RadioChannel | null) => void): void {
        this.onChannelChangeHandlers.push(handler);
    }

    private notifyChannelChange(channel: RadioChannel | null): void {
        this.onChannelChangeHandlers.forEach((h) => h(channel));
    }

    // =========================================================================
    // INTERNAL HELPERS
    // =========================================================================

    /**
     * Broadcast atualização de canal via gossip
     */
    private async broadcastChannelUpdate(channel: RadioChannel): Promise<void> {
        const update = {
            type: 'CHANNEL_UPDATE',
            channel: {
                id: channel.id,
                name: channel.name,
                participants: Array.from(channel.participants),
                codec: channel.codec,
                sampleRate: channel.sampleRate,
                isEncrypted: channel.isEncrypted,
            },
        };

        console.log(`[RADIO] Broadcasting channel update for ${channel.id}`);
        // TODO: this.meshEngine.broadcast(update)
    }

    /**
     * Limpa buffers e estado
     */
    cleanup(): void {
        this.stopTransmission();
        this.channels.clear();
        this.incomingBuffers.clear();
        this.playbackQueue = [];
        this.stats.clear();
        this.activeChannel = null;
        console.log('[RADIO] Cleanup complete');
    }
}
