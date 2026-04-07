/**
 * AudNova V22.0 - Aether Engineering Constants
 * Adapta a especificação técnica da arquitetura Aether Elite V10.8.2
 * para o projeto AudNova design-first
 */

// ============================================================================
// NETWORK & PACKET CONFIGURATION
// ============================================================================

export const PACKET_TYPES = {
    MESSAGE: 0x01,      // Chat/P2P
    AUDIO: 0x02,        // Audio segment
    CONTROL: 0x03,      // Handshake, codec, keys
    GOSSIP: 0x04,       // Mesh sync
    HEARTBEAT: 0x05,    // Keep-alive
    EMERGENCY: 0xee,    // SOS (máxima prioridade)
} as const;

export const PRIORITIES = {
    EMERGENCY: 'emergency',
    HIGH: 'high',
    NORMAL: 'normal',
    LOW: 'low',
} as const;

export const MESH_CONFIG = {
    PEER_TIMEOUT_MS: 60000,           // Kick após 60s sem contato
    DEDUP_WINDOW_MS: 30000,           // Janela anti-replay
    GOSSIP_FAN_OUT: 3,                // Quantos peers propagar
    SEEN_PACKETS_LRU: 2000,           // Cache de pacotes vistos
    HANDSHAKE_RETRY_MS: 5000,         // Retry interval
    MAX_PACKET_SIZE_BYTES: 65536,     // 64KB max
    TTL_BASE: (size: number) => Math.min(10, 2 + Math.log2(Math.max(1, size))),
} as const;

// ============================================================================
// AUDIO & CODEC CONFIGURATION
// ============================================================================

export const AUDIO_SPECS = {
    CODECS: {
        OPUS: 'OPUS',
        PCM: 'PCM',
        AAC: 'AAC',
    },
    SAMPLE_RATES: {
        OPUS: [8000, 16000, 22050, 44100, 48000],
        PCM: [8000, 16000, 22050, 44100],
        AAC: [16000, 22050, 44100, 48000],
    },
    FEC_MODES: {
        DISABLED: 'DISABLED',
        LIGHT: 'k=2,n=3',      // 2+1 recovery
        MEDIUM: 'k=3,n=5',     // 3+2 recovery
        HEAVY: 'k=4,n=6',      // 4+2 recovery
    },
    POWER_MODES: {
        LOW: {
            name: 'LOW',
            sampleRate: 16000,
            fecMode: 'DISABLED',
            preferredCodec: 'PCM',
            chunkDurationMs: 100,
            description: 'Economia energética - bateria fraca',
        },
        MEDIUM: {
            name: 'MEDIUM',
            sampleRate: 22050,
            fecMode: 'k=2,n=3',
            preferredCodec: 'OPUS',
            chunkDurationMs: 60,
            description: 'Balanceado - operação normal',
        },
        HIGH: {
            name: 'HIGH',
            sampleRate: 44100,
            fecMode: 'k=4,n=6',
            preferredCodec: 'OPUS',
            chunkDurationMs: 40,
            description: 'Alto desempenho - ótima qualidade',
        },
    },
    JITTER_BUFFER: {
        TARGET_MS: { LOW: 200, MEDIUM: 150, HIGH: 100 },
        MIN_MS: 50,
        MAX_MS: 500,
        UNDERRUN_ALERT_THRESHOLD: 2,
    },
} as const;

// ============================================================================
// SECURITY & CRYPTOGRAPHY
// ============================================================================

export const CRYPTO_SPEC = {
    ECDH_CURVE: 'P-256',
    ECDSA_CURVE: 'secp256k1',
    SYMMETRIC_CIPHER: 'AES-256-GCM',
    KEY_DERIVATION: 'HKDF-SHA256',
    SESSION_WINDOW_SEC: 30,           // Anti-replay window
    KEY_ROTATION_INTERVAL_MS: 3600000, // 1 hour
    DID_PREFIX: 'did:aether:',
} as const;

// ============================================================================
// IDENTITY & SEED MANAGEMENT
// ============================================================================

export const IDENTITY_CONFIG = {
    BIP39_WORD_COUNT: 12,             // 12 palavras mnemônicas
    SEED_ENTROPY_BITS: 128,
    KEY_DERIVATION_PATH: "m/44'/0'/0'/0/0", // BIP44 standard
    DER_MAX_ROUNDS: 10000,
} as const;

// ============================================================================
// HYPER ECONOMY (Moeda Virtual)
// ============================================================================

export const HYPER_ECONOMY = {
    DAILY_GRANT: 3,                   // +3 hypers ao logar (Originais)
    DAILY_GRANT_RESET_HOUR: 0,        // 00:00 UTC
    INVITE_COST: 1,                   // 1 hyper por convite
    EMOJI_REACTION_COST: 0,           // Grátis
    BADGE_COSTS: {
        COMMON: 10,
        RARE: 25,
        EPIC: 50,
        LEGENDARY: 100,
    },
    TRANSACTION_TYPES: [
        'DAILY_GRANT',
        'INVITE',
        'DONATION',
        'BADGE_PURCHASE',
        'BURN',
    ],
} as const;

// ============================================================================
// STORAGE & PERSISTENCE KEYS
// ============================================================================

export const STORAGE = {
    KEYS: {
        // Identity & Auth
        SEED: 'auth_seed_v4',
        DID: 'auth_did_v4',
        ACCOUNT: 'auth_account_v4',
        SALT: 'auth_salt_v4',
        PROFILE: 'profile_v4',

        // Encryption & Keys
        RATCHET_STATE: 'ratchet_state_v4',
        SESSION_KEYS: 'session_keys_v4',
        KEY_CACHE: 'key_cache_v4',

        // Application
        HYPER_WALLET: 'hyper_wallet_v4',
        BADGES: 'badges_v4',
        PROFILE_MODE: 'profile_mode_v4',

        // Communication
        MESSAGES: 'messages_v4',
        THREADS: 'threads_v4',
        DONOR_MURAL: 'donor_mural_v4',  // 24h history

        // Radio & Audio
        RADIO_PLAYLISTS: 'radio_playlists_v4',
        AUDIO_CACHE: 'audio_cache_v4',
        CURRENT_CHANNEL: 'current_channel_v4',

        // Network
        PEER_CACHE: 'peer_cache_v4',
        NETWORK_MAP: 'network_map_v4',

        // Maintenance
        LAST_MIDNIGHT_PURGE: 'last_midnight_purge_v4',
    },
    RETENTION: {
        MESSAGES: 'PERMANENT', // Private messages kept forever
        DONOR_MURAL: 86400000, // 24 hours
        AUDIO_CACHE: 3600000,  // 1 hour
        PEER_CACHE: 1800000,   // 30 minutes
        NETWORK_MAP: 300000,   // 5 minutes
    },
} as const;

// ============================================================================
// MAINTENANCE & LIFECYCLE
// ============================================================================

export const MAINTENANCE = {
    MIDNIGHT_PURGE_HOUR: 0,           // 00:00 local
    PURGE_CONFIG: {
        CHAT_LOGS: true,
        AUDIO_CACHE: true,
        PEER_CACHE: true,
        PRESERVE_MESSAGES: true,         // Keep P2P
        PRESERVE_DONOR_MURAL: true,      // Keep 24h
        PRESERVE_HYPERS_LOG: true,
    },
    BACKGROUND_SYNC_INTERVAL_MS: 30000, // 30s
} as const;

// ============================================================================
// UI/UX CONFIGURATION (Cyberpunk Experience)
// ============================================================================

export const CYBERDECK = {
    AUDIO_CONTROL: {
        TALKOVER_DUCKING_MS: 300,
        TALKOVER_MUSIC_VOLUME: 0.2,      // 20% reduction
        SOUNDBOARD_COOLDOWN_MS: 500,
    },
    NOTIFICATIONS: {
        HYPER_TOAST_DURATION_MS: 2000,
        TYPING_INDICATOR_TIMEOUT_MS: 3000,
        CAROUSEL_LOOP_PERIOD_MS: 60000,  // 60s
        CAROUSEL_MAX_IMAGES: 5,
    },
    USER_ACTIONS: {
        NICKNAME_CHANGE_COOLDOWN_DAYS: 7,
        PHOTO_UPLOAD_COOLDOWN_DAYS: 3,
    },
    COLORS: {
        MIC_LOCK: '#ffcc00',             // Amarelo
        ON_AIR: '#ff0000',               // Vermelho
        NEON_CYAN: '#00ccff',
        NEON_MAGENTA: '#ff00e5',
        ALERT: '#ff3300',
    },
} as const;

// ============================================================================
// BADGES & HIERARCHY
// ============================================================================

export const BADGE_CATALOG = {
    FOUNDER: {
        id: 'FOUNDER',
        name: 'Fundador',
        icon: '👑',
        rarity: 'legendary',
        costHypers: 50,
        tier: 'LEGENDARY',
    },
    ARCHON_WITNESS: {
        id: 'ARCHON_WITNESS',
        name: 'Testemunha Archon',
        icon: '⚡',
        rarity: 'epic',
        costHypers: 25,
        tier: 'EPIC',
    },
    EARLY_SUPPORTER: {
        id: 'EARLY_SUPPORTER',
        name: 'Apoiador Antigo',
        icon: '🌟',
        rarity: 'rare',
        costHypers: 15,
        tier: 'RARE',
    },
    REGULAR: {
        id: 'REGULAR',
        name: 'Usuário Regular',
        icon: '💫',
        rarity: 'common',
        costHypers: 5,
        tier: 'COMMON',
    },
} as const;

// ============================================================================
// DEBUG & MONITORING
// ============================================================================

export const LOGGING = {
    LEVELS: {
        DEBUG: 'DEBUG',
        INFO: 'INFO',
        WARN: 'WARN',
        ERROR: 'ERROR',
    },
    TAGS: {
        MESH: '[MESH]',
        AUDIO: '[AUDIO]',
        CRYPTO: '[CRYPTO]',
        STORAGE: '[STORAGE]',
        HYPER: '[HYPER]',
        MAINTENANCE: '[MAINTENANCE]',
        UI: '[UI]',
    },
    METRICS: {
        TRACK_LQM: true,              // Link Quality Metric
        TRACK_PACKET_LOSS: true,
        TRACK_LATENCY: true,
        TRACK_FEC_RECOVERY: true,
    },
} as const;

// ============================================================================
// VERSION & BRANDING
// ============================================================================

export const AUDNOVA_VERSION = {
    MAJOR: 22,
    MINOR: 0,
    PATCH: 0,
    BUILD_DATE: '2026-04-07',
    AETHER_BASE: 'v10.8.2',
    BRANDING: '3eatCru Studio',
    STATUS: 'ALPHA',
} as const;
