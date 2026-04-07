/**
 * AudNova V22.0 - Core Types Framework
 * Adaptado da engenharia Aether Elite V10.8.2
 * 
 * Defines base types para:
 * - Identidade (DID, Seeds, Keys)
 * - Pacotes de Rede (SecurePacket, CONTROL, EMERGENCY)
 * - Estados de Áudio (Codec, FEC, Jitter)
 */

// ============================================================================
// 1. IDENTIDADE & CRIPTOGRAFIA
// ============================================================================

export interface SeedIdentity {
    mnemonic: string; // 12 palavras BIP39
    masterKey: Uint8Array;
    salt: Uint8Array;
}

export interface DIDCertificate {
    id: string; // did:aether:${uuid}
    publicKey: string; // base64 ECDH P-256
    privateKey?: string; // base64 (apenas em storage local)
    issued: number; // timestamp
    expires?: number;
    signature?: string; // ECDSA secp256k1
}

export interface KeyPair {
    publicKey: Uint8Array;
    privateKey: Uint8Array;
}

export interface SessionKeyState {
    keyId: string;
    symmetricKey: Uint8Array; // AES-256
    nonce: Uint8Array;
    issuedAt: number;
    expiresAt: number;
}

// ============================================================================
// 2. PACOTES DE REDE (SecurePacket)
// ============================================================================

export type PacketType =
    | 'MESSAGE'      // 0x01 - Chat/P2P
    | 'AUDIO'        // 0x02 - Audio segment
    | 'CONTROL'      // 0x03 - Handshake, codec, keys
    | 'EMERGENCY'    // 0xEE - SOS (máxima prioridade)
    | 'GOSSIP'       // 0x04 - Mesh sync
    | 'HEARTBEAT'    // 0x05 - Keep-alive;

export interface PacketMetadata {
    id: string; // UUID
    type: PacketType;
    from: string; // DID do sender
    to?: string; // DID destino (unicast) ou undefined (broadcast)
    timestamp: number; // ms
    ttl: number; // Time-to-live (saltos)
    seq: number; // Sequence number para dedup
    priority: 'low' | 'normal' | 'high' | 'emergency';
}

export interface SecurePacket {
    metadata: PacketMetadata;
    payload: Uint8Array;
    publicKey: string; // PK do sender (base64)
    signature: string; // ECDSA signature (base64)
    encrypted: boolean;
    compressed: boolean;
}

export interface ControlPayload {
    action: 'HANDSHAKE' | 'KEY_ROTATE' | 'CODEC_SWITCH' | 'SOS_ENABLE' | 'SOS_DISABLE';
    data: Record<string, any>;
}

// ============================================================================
// 3. CODEC & ÁUDIO
// ============================================================================

export type AudioCodec = 'OPUS' | 'PCM' | 'AAC';
export type PowerMode = 'LOW' | 'MEDIUM' | 'HIGH';
export type FECMode = 'DISABLED' | 'k=2,n=3' | 'k=3,n=5' | 'k=4,n=6';

export interface AudioSegmentHeader {
    codec: AudioCodec;
    sampleRate: number; // 8000, 16000, 22050, 44100
    channels: number;
    bitrate: number; // kbps
    fecMode: FECMode;
    jitterMs: number; // Jitter buffer target
    ts: number; // RTP timestamp
}

export interface AudioSegment {
    header: AudioSegmentHeader;
    data: Uint8Array; // Encoded audio
    duration: number; // ms
    seqNum: number;
    lost: boolean; // FEC recovery flag
}

export interface JitterBufferState {
    buffer: AudioSegment[];
    sizeMs: number; // Current fill
    targetMs: number; // Desired size
    underruns: number;
    lossRate: number; // percentage
}

// ============================================================================
// 4. MESH & TRANSPORTE
// ============================================================================

export interface PeerInfo {
    id: string; // DID
    port?: number; // TCP/UDP port (P2P)
    ip?: string;
    signal?: number; // RSSI or quality metric (-100 to 0 dBm)
    distance?: number; // hops
    lastSeen: number; // timestamp
    publicKey: string; // ECDH pubkey (base64)
    isOnline: boolean;
}

export interface NetworkRoute {
    destination: string; // DID
    nextHop: string; // Immediate neighbor
    distance: number; // hops
    quality: number; // 0-1 (LQM: Link Quality Metric)
    lastUpdated: number;
}

export interface GossipDigest {
    peerId: string;
    seqNum: number;
    messageCount: number;
    hops: number;
}

// ============================================================================
// 5. APLICAÇÃO & ESTADO
// ============================================================================

export interface ProfileState {
    did: string;
    alias: string; // nickname < 15 chars
    hypers: number; // Moeda virtual
    badges: BadgeInfo[];
    isOriginal: boolean; // Creator vs Guest
    avatar?: string; // base64 ou URL
    favoriteRadios: string[];
    lastLogin: number;
}

export interface BadgeInfo {
    id: string; // ARCHON_WITNESS, FOUNDER, etc
    name: string;
    icon: string; // emoji ou SVG
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    acquiredAt: number;
    isNew: boolean;
}

export interface RadioRoomInfo {
    id: string; // UUID
    name: string;
    creator: string; // DID
    members: string[]; // DIDs
    isPublic: boolean;
    description?: string;
    coverImage?: string;
    rules?: string;
    currentTrack?: string;
}

export interface MessageThread {
    id: string;
    participants: string[]; // DIDs
    messages: ChatMessage[];
    lastActivity: number;
    isEncrypted: boolean;
}

export interface ChatMessage {
    id: string;
    from: string; // DID sender
    text: string;
    timestamp: number;
    isRead: boolean;
    encrypted: boolean;
    reactions?: Record<string, number>; // emoji -> count
}

// ============================================================================
// 6. HYPER & ECONOMIA
// ============================================================================

export interface HyperTransaction {
    id: string;
    from: string; // DID
    to?: string; // undefined para queima
    amount: number;
    reason: 'DAILY_GRANT' | 'INVITE' | 'DONATION' | 'BADGE_PURCHASE' | 'BURN';
    timestamp: number;
}

export interface HyperWallet {
    did: string;
    balance: number;
    pendingTransactions: HyperTransaction[];
    lastGrantDate: number; // Para limitar +3 daily
}

// ============================================================================
// 7. STORAGE & PERSISTENCE
// ============================================================================

export interface StorageKey {
    key: string;
    encrypted: boolean;
    salt?: string;
}

export interface RatchetState {
    chainKey: Uint8Array;
    messageKey: Uint8Array;
    counter: number;
    isDHRatchet: boolean;
}

export interface SecureStorageRecord {
    key: string;
    value: Uint8Array; // Encrypted with AES-GCM
    salt: Uint8Array;
    iv: Uint8Array;
    tag: Uint8Array;
    createdAt: number;
    expiresAt?: number;
}

// ============================================================================
// 8. SERVICE INTERFACES (Contracts)
// ============================================================================

export interface ITransport {
    send(data: Uint8Array, to?: string): Promise<void>;
    broadcast(data: Uint8Array): Promise<void>;
    onMessage: (handler: (msg: SecurePacket) => void) => void;
}

export interface IMeshEngine {
    addPeer(peer: PeerInfo): void;
    removePeer(peerId: string): void;
    broadcast(packet: SecurePacket): Promise<void>;
    unicast(packet: SecurePacket, to: string): Promise<void>;
    getNetworkMap(): NetworkRoute[];
}

export interface IRadioService {
    createChannel(id: string): void;
    pushAudio(channelId: string, segment: AudioSegment): void;
    onAudio: (handler: (segment: AudioSegment) => void) => void;
    setCodec(codec: AudioCodec): void;
    setPowerMode(mode: PowerMode): void;
}

export interface ICryptoService {
    generateKeyPair(): Promise<KeyPair>;
    sign(data: Uint8Array): Promise<Uint8Array>;
    verify(data: Uint8Array, signature: Uint8Array, pubKey: string): boolean;
    encrypt(data: Uint8Array, key: Uint8Array): Promise<Uint8Array>;
    decrypt(data: Uint8Array, key: Uint8Array): Promise<Uint8Array>;
}

export interface IStorageService {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
