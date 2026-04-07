/**
 * AudNova V22.0 - AudioService
 * Pipeline de áudio: codec selection, FEC, jitter buffer
 * Baseado na engenharia Aether Elite V10.8.2
 */

import { AudioSegment, AudioSegmentHeader, JitterBufferState, PowerMode } from '../types';
import { AUDIO_SPECS } from '../core/config';

/**
 * Serviço de áudio - codecs, FEC, jitter buffer
 */
export class AudioService {
    private jitterBuffer: JitterBufferState;
    private powerMode: PowerMode = 'MEDIUM';
    private receiveHandlers: ((segment: AudioSegment) => void)[] = [];

    constructor(powerMode: PowerMode = 'MEDIUM') {
        this.powerMode = powerMode;
        this.jitterBuffer = {
            buffer: [],
            sizeMs: 0,
            targetMs: AUDIO_SPECS.JITTER_BUFFER.TARGET_MS[powerMode],
            underruns: 0,
            lossRate: 0,
        };
    }

    // =========================================================================
    // CODEC SELECTION
    // =========================================================================

    /**
     * Seleciona codec baseado em power mode e qualidade esperada
     */
    selectCodec(qualityPreference: 'low' | 'medium' | 'high' = 'medium'): string {
        const config = AUDIO_SPECS.POWER_MODES[this.powerMode];

        // Em LOW power, forçar PCM
        if (this.powerMode === 'LOW') {
            return AUDIO_SPECS.CODECS.PCM;
        }

        // Em MEDIUM/HIGH, preferir Opus se disponível
        return AUDIO_SPECS.CODECS.OPUS;
    }

    /**
     * Retorna sample rate recomendado
     */
    getRecommendedSampleRate(): number {
        return AUDIO_SPECS.POWER_MODES[this.powerMode].sampleRate;
    }

    /**
     * Retorna chunk duration em ms
     */
    getChunkDurationMs(): number {
        return AUDIO_SPECS.POWER_MODES[this.powerMode].chunkDurationMs;
    }

    // =========================================================================
    // FEC (Forward Error Correction)
    // =========================================================================

    /**
     * Codifica payload com FEC (simulado)
     * k=quantidade de data packets, n=total de packets
     * Exemplo: k=4,n=6 pode recuperar 2 perdas
     */
    encodeFEC(payload: Uint8Array, fecMode: string): Uint8Array[] {
        // Parse FEC mode: "k=4,n=6"
        const match = fecMode.match(/k=(\d+),n=(\d+)/);
        if (!match) return [payload]; // Fallback: no FEC

        const k = parseInt(match[1]);
        const n = parseInt(match[2]);
        const overhead = n - k;

        console.log(`[AUDIO] FEC encoding: ${k}+${overhead} (${fecMode})`);

        // Simulação: dividir payload em k chunks, gerar n packets
        // Em produção: usar @noble/fec ou biblioteca similar
        const chunkSize = Math.ceil(payload.length / k);
        const packets: Uint8Array[] = [];

        // Data packets
        for (let i = 0; i < k; i++) {
            const start = i * chunkSize;
            const end = Math.min(start + chunkSize, payload.length);
            packets.push(payload.slice(start, end));
        }

        // Parity packets (simulados - ideal usar Reed-Solomon)
        for (let i = 0; i < overhead; i++) {
            const parity = new Uint8Array(chunkSize);
            for (let j = 0; j < k; j++) {
                const packet = packets[j];
                for (let b = 0; b < parity.length; b++) {
                    parity[b] ^= (packet[b] || 0);
                }
            }
            packets.push(parity);
        }

        return packets;
    }

    /**
     * Decodifica payload com FEC recovery
     * (Simplificado - em produção usar Reed-Solomon proper)
     */
    decodeFEC(packets: (Uint8Array | null)[], k: number): Uint8Array | null {
        const available = packets.filter((p) => p !== null).length;

        if (available < k) {
            console.warn(`[AUDIO] FEC: only ${available}/${k} packets available`);
            return null;
        }

        // Combinar packets disponíveis
        let result = new Uint8Array(0);
        for (let i = 0; i < k; i++) {
            if (packets[i]) {
                result = new Uint8Array([...result, ...packets[i]]);
            }
        }

        return result;
    }

    // =========================================================================
    // JITTER BUFFER
    // =========================================================================

    /**
     * Insere audio segment no jitter buffer
     */
    bufferSegment(segment: AudioSegment): void {
        this.jitterBuffer.buffer.push(segment);
        this.jitterBuffer.sizeMs += segment.duration;

        // Reordenar por sequence number
        this.jitterBuffer.buffer.sort((a, b) => a.seqNum - b.seqNum);

        // Log status
        const percent = (this.jitterBuffer.sizeMs / this.jitterBuffer.targetMs) * 100;
        console.log(
            `[AUDIO] Jitter buffer: ${this.jitterBuffer.sizeMs}ms (${percent.toFixed(0)}% of target)`
        );
    }

    /**
     * Retira primeiro segment pronto para playback
     */
    getNextSegment(): AudioSegment | null {
        if (
            this.jitterBuffer.buffer.length === 0 ||
            this.jitterBuffer.sizeMs < this.jitterBuffer.targetMs * 0.5
        ) {
            this.jitterBuffer.underruns++;
            if (this.jitterBuffer.underruns > AUDIO_SPECS.JITTER_BUFFER.UNDERRUN_ALERT_THRESHOLD) {
                console.warn('[AUDIO] Jitter buffer underruns detected!');
            }
            return null;
        }

        const segment = this.jitterBuffer.buffer.shift()!;
        this.jitterBuffer.sizeMs -= segment.duration;
        return segment;
    }

    /**
     * Retorna estado atual do jitter buffer
     */
    getJitterBufferState(): JitterBufferState {
        return { ...this.jitterBuffer };
    }

    /**
     * Reseta jitter buffer (ao trocar codec ou perda severa)
     */
    resetJitterBuffer(): void {
        this.jitterBuffer.buffer = [];
        this.jitterBuffer.sizeMs = 0;
        this.jitterBuffer.underruns = 0;
        console.log('[AUDIO] Jitter buffer reset');
    }

    // =========================================================================
    // AUDIO EVENTS & HANDLERS
    // =========================================================================

    /**
     * Registra handler para audio segments
     */
    onAudioSegment(handler: (segment: AudioSegment) => void): void {
        this.receiveHandlers.push(handler);
    }

    /**
     * Emite audio segment para listeners
     */
    protected emitAudioSegment(segment: AudioSegment): void {
        this.receiveHandlers.forEach((handler) => {
            try {
                handler(segment);
            } catch (error) {
                console.error(`[AUDIO] Handler error: ${error}`);
            }
        });
    }

    // =========================================================================
    // POWER MODE MANAGEMENT
    // =========================================================================

    /**
     * Muda power mode e ajusta config
     */
    setPowerMode(mode: PowerMode): void {
        if (this.powerMode === mode) return;

        const oldMode = this.powerMode;
        this.powerMode = mode;

        // Atualizar config
        const config = AUDIO_SPECS.POWER_MODES[mode];
        this.jitterBuffer.targetMs = AUDIO_SPECS.JITTER_BUFFER.TARGET_MS[mode];

        console.log(
            `[AUDIO] Power mode: ${oldMode} -> ${mode} ` +
            `(sr=${config.sampleRate}, fec=${config.fecMode})`
        );
    }

    /**
     * Retorna config atual por power mode
     */
    getCurrentConfig() {
        return AUDIO_SPECS.POWER_MODES[this.powerMode];
    }

    // =========================================================================
    // METRICS & DIAGNOSTICS
    // =========================================================================

    /**
     * Calcula loss rate baseado em sequence gaps
     */
    updateLossRate(expectedSeq: number, receivedSeq: number): void {
        const gap = receivedSeq - expectedSeq;
        if (gap > 0) {
            const loss = (gap / receivedSeq) * 100;
            this.jitterBuffer.lossRate = Math.min(100, loss);
            console.log(`[AUDIO] Loss rate: ${this.jitterBuffer.lossRate.toFixed(2)}%`);
        }
    }

    /**
     * Retorna estatísticas
     */
    getStatistics() {
        return {
            powerMode: this.powerMode,
            jitterMs: this.jitterBuffer.sizeMs,
            targetMs: this.jitterBuffer.targetMs,
            underruns: this.jitterBuffer.underruns,
            lossRate: this.jitterBuffer.lossRate,
            bufferLength: this.jitterBuffer.buffer.length,
        };
    }
}

/**
 * Factory para criar AudioService com config padrão
 */
export function createAudioService(powerMode: PowerMode = 'MEDIUM'): AudioService {
    return new AudioService(powerMode);
}
