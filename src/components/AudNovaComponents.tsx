/**
 * AudNova V22.0 - Example Integrated Components
 * Demonstra como usar os hooks com React
 * Baseado na engenharia Aether Elite V10.8.2
 */

import React, { useState, useEffect } from 'react';
import { useRadio, useMessage, useRatchet, useIdentity } from '../hooks';
import { RadioService } from '../services/RadioService';
import { MessageService } from '../services/MessageService';
import { RatchetService } from '../services/RatchetService';
import { IdentityService } from '../services/IdentityService';

// ============================================================================
// RadioChannelComponent - Demonstra uso de useRadio hook
// ============================================================================

interface RadioChannelComponentProps {
    radioService: RadioService;
}

export function RadioChannelComponent({ radioService }: RadioChannelComponentProps) {
    const {
        activeChannel,
        channels,
        isTransmitting,
        createChannel: createRadioChannel,
        joinChannel: joinRadio,
        startTransmit,
        stopTransmit,
    } = useRadio(radioService);

    const [channelName, setChannelName] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);

    const handleCreateChannel = async () => {
        const channel = await createRadioChannel(channelName, true);
        if (channel) {
            setChannelName('');
            setShowCreateForm(false);
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ddd' }}>
            <h2>🎙️ Audio Channels</h2>

            {/* Status */}
            {activeChannel && (
                <div style={{ backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '10px' }}>
                    <p>
                        <strong>Active:</strong> {activeChannel.name} ({activeChannel.participants.size} participants)
                    </p>
                    <p>
                        <strong>Status:</strong> {isTransmitting ? '🔴 TRANSMITTING' : '⚪ Standby'}
                    </p>
                </div>
            )}

            {/* Available Channels */}
            <div style={{ marginBottom: '10px' }}>
                <h3>Available Channels:</h3>
                {channels.length === 0 ? (
                    <p style={{ color: '#999' }}>No channels yet</p>
                ) : (
                    <ul>
                        {channels.map((ch) => (
                            <li key={ch.id}>
                                {ch.name} ({ch.participants.size}) {ch.isEncrypted ? '🔒' : '🔓'}
                                {activeChannel?.id !== ch.id && (
                                    <button onClick={() => joinRadio(ch.id)} style={{ marginLeft: '10px' }}>
                                        Join
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Create Channel */}
            <div>
                <button onClick={() => setShowCreateForm(!showCreateForm)}>+ Create Channel</button>
                {showCreateForm && (
                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9f9f9' }}>
                        <input
                            type="text"
                            placeholder="Channel name..."
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                        />
                        <button onClick={handleCreateChannel}>Create</button>
                    </div>
                )}
            </div>

            {/* Transmission Controls */}
            {activeChannel && (
                <div style={{ marginTop: '10px' }}>
                    {!isTransmitting ? (
                        <button onClick={() => startTransmit()} style={{ backgroundColor: '#4CAF50', color: 'white' }}>
                            🎤 Start Transmit
                        </button>
                    ) : (
                        <button onClick={() => stopTransmit()} style={{ backgroundColor: '#f44336', color: 'white' }}>
                            ⏹ Stop Transmit
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// ChatThreadComponent - Demonstra uso de useMessage hook
// ============================================================================

interface ChatThreadComponentProps {
    messageService: MessageService;
    peerId: string;
}

export function ChatThreadComponent({ messageService, peerId }: ChatThreadComponentProps) {
    const [threadId, setThreadId] = useState<string | null>(null);
    const { messages, unreadCount, sendMessage, setTyping, search } = useMessage(messageService, threadId);
    const [inputText, setInputText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Create P2P thread on mount
    useEffect(() => {
        const thread = messageService.createP2PThread(peerId);
        setThreadId(thread.id);
    }, [messageService, peerId]);

    const handleSendMessage = async () => {
        if (inputText.trim()) {
            await setTyping(false);
            await sendMessage(inputText);
            setInputText('');
        }
    };

    const handleSearch = () => {
        const results = search(searchQuery);
        setSearchResults(results);
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ddd', marginTop: '20px' }}>
            <h2>💬 Chat with {peerId}</h2>

            {/* Unread Count */}
            {unreadCount > 0 && <p style={{ color: 'red' }}>📬 {unreadCount} unread messages</p>}

            {/* Messages Display */}
            <div
                style={{
                    backgroundColor: '#f5f5f5',
                    padding: '10px',
                    height: '300px',
                    overflowY: 'auto',
                    marginBottom: '10px',
                }}
            >
                {messages.length === 0 ? (
                    <p style={{ color: '#999' }}>No messages yet</p>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#fff' }}>
                            <strong>{msg.senderId}:</strong> {msg.text}
                            <br />
                            <small style={{ color: '#999' }}>
                                {new Date(msg.timestamp).toLocaleTimeString()} - {msg.deliveryStatus}
                                {msg.isEncrypted ? ' 🔒' : ''}
                            </small>
                        </div>
                    ))
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fffacd' }}>
                        <h4>Search Results ({searchResults.length}):</h4>
                        {searchResults.map((msg) => (
                            <div key={msg.id} style={{ marginBottom: '5px' }}>
                                <strong>{msg.senderId}:</strong> {msg.text}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Search */}
            <div style={{ marginBottom: '10px' }}>
                <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={handleSearch}>Search</button>
            </div>

            {/* Message Input */}
            <div style={{ display: 'flex', gap: '5px' }}>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => {
                        setInputText(e.target.value);
                        setTyping(e.target.value.length > 0);
                    }}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleSendMessage();
                        }
                    }}
                />
                <button onClick={handleSendMessage} style={{ backgroundColor: '#2196F3', color: 'white' }}>
                    Send
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// E2EEChatComponent - Demonstra uso de useRatchet hook (Double Ratchet E2EE)
// ============================================================================

interface E2EEChatComponentProps {
    ratchetService: RatchetService;
    peerId: string;
}

export function E2EEChatComponent({ ratchetService, peerId }: E2EEChatComponentProps) {
    const { sessionId, isEncrypted, initSession, encryptMessage, decryptMessage } = useRatchet(
        ratchetService,
        peerId
    );

    const [inputText, setInputText] = useState('');
    const [encryptedMessage, setEncryptedMessage] = useState<string | null>(null);
    const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null);

    const handleEncrypt = async () => {
        const encrypted = await encryptMessage(inputText);
        setEncryptedMessage(encrypted);
    };

    const handleDecrypt = async () => {
        if (encryptedMessage) {
            const decrypted = await decryptMessage(encryptedMessage);
            setDecryptedMessage(decrypted);
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ddd', marginTop: '20px' }}>
            <h2>🔐 E2EE Chat with {peerId}</h2>

            <p>
                <strong>Status:</strong> {isEncrypted ? '✅ Encrypted' : '⚪ Not encrypted'}
                {sessionId && <p style={{ color: 'green' }}>Session ID: {sessionId.substring(0, 20)}...</p>}
            </p>

            {/* Initialize Session */}
            {!sessionId && (
                <button
                    onClick={() => initSession(new Uint8Array(65))}
                    style={{ backgroundColor: '#FF9800', color: 'white' }}
                >
                    Initialize Encryption
                </button>
            )}

            {/* Encryption Demo */}
            {sessionId && (
                <div style={{ marginTop: '10px' }}>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            placeholder="Message to encrypt..."
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                        />
                        <button onClick={handleEncrypt}>Encrypt</button>
                    </div>

                    {encryptedMessage && (
                        <div style={{ backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '10px' }}>
                            <p>
                                <strong>Encrypted (truncated):</strong>
                            </p>
                            <p style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                {encryptedMessage.substring(0, 100)}...
                            </p>
                            <button onClick={handleDecrypt}>Decrypt</button>
                        </div>
                    )}

                    {decryptedMessage && (
                        <div style={{ backgroundColor: '#c8e6c9', padding: '10px' }}>
                            <p>
                                <strong>Decrypted:</strong> {decryptedMessage}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// IdentityComponent - Demonstra uso de useIdentity hook
// ============================================================================

interface IdentityComponentProps {
    identityService: IdentityService;
}

export function IdentityComponent({ identityService }: IdentityComponentProps) {
    const { seed, did, isLoaded, generateNewIdentity, verifyDid, isDidExpired } = useIdentity(identityService);
    const [showSeed, setShowSeed] = useState(false);
    const [isExpired, setIsExpired] = useState(false);

    const handleGenerateIdentity = async () => {
        const identity = await generateNewIdentity();
        if (identity) {
            const expired = await isDidExpired();
            setIsExpired(expired);
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid #ddd', marginTop: '20px' }}>
            <h2>🔑 Identity Management</h2>

            {!isLoaded ? (
                <button onClick={handleGenerateIdentity} style={{ backgroundColor: '#9C27B0', color: 'white' }}>
                    Generate New Identity
                </button>
            ) : (
                <div>
                    {/* DID Display */}
                    {did && (
                        <div style={{ backgroundColor: '#f0f0f0', padding: '10px', marginBottom: '10px' }}>
                            <p>
                                <strong>DID:</strong> {did.id}
                            </p>
                            <p>
                                <strong>Created:</strong> {new Date(did.issuedAt).toLocaleString()}
                            </p>
                            <p>
                                <strong>Status:</strong> {isExpired ? '❌ Expired' : '✅ Valid'}
                            </p>
                        </div>
                    )}

                    {/* Seed Display */}
                    <div>
                        <button onClick={() => setShowSeed(!showSeed)}>
                            {showSeed ? 'Hide Seed' : 'Show Seed'}
                        </button>
                        {showSeed && seed && (
                            <div style={{ backgroundColor: '#fff3cd', padding: '10px', marginTop: '10px' }}>
                                <p style={{ color: 'red' }}>
                                    ⚠️ <strong>KEEP THIS SEED SECRET!</strong>
                                </p>
                                <p style={{ fontFamily: 'monospace', wordBreak: 'break-all', userSelect: 'all' }}>
                                    {seed.mnemonic}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Main App Demo - Integração completa
// ============================================================================

export function AudNovaAppDemo() {
    const [activeTab, setActiveTab] = useState<'identity' | 'radio' | 'chat' | 'e2ee'>('identity');

    // Services (em produção, viriam via context/provider)
    const radioService = null; // TODO: initialize
    const messageService = null; // TODO: initialize
    const ratchetService = null; // TODO: initialize
    const identityService = null; // TODO: initialize

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h1>🎙️ AudNova V22.0 - UI Integration Demo</h1>

            {/* Tab Navigation */}
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => setActiveTab('identity')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'identity' ? '#2196F3' : '#ddd',
                        color: activeTab === 'identity' ? 'white' : 'black',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    Identity
                </button>
                <button
                    onClick={() => setActiveTab('radio')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'radio' ? '#2196F3' : '#ddd',
                        color: activeTab === 'radio' ? 'white' : 'black',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    Radio
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'chat' ? '#2196F3' : '#ddd',
                        color: activeTab === 'chat' ? 'white' : 'black',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    Chat
                </button>
                <button
                    onClick={() => setActiveTab('e2ee')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'e2ee' ? '#2196F3' : '#ddd',
                        color: activeTab === 'e2ee' ? 'white' : 'black',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    E2EE
                </button>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'identity' && identityService && <IdentityComponent identityService={identityService} />}
                {activeTab === 'radio' && radioService && <RadioChannelComponent radioService={radioService} />}
                {activeTab === 'chat' && messageService && (
                    <ChatThreadComponent messageService={messageService} peerId="bob" />
                )}
                {activeTab === 'e2ee' && ratchetService && (
                    <E2EEChatComponent ratchetService={ratchetService} peerId="alice" />
                )}
                {!identityService && <p style={{ color: '#999' }}>Services not initialized (TODO: setup context)</p>}
            </div>
        </div>
    );
}

export default {
    RadioChannelComponent,
    ChatThreadComponent,
    E2EEChatComponent,
    IdentityComponent,
    AudNovaAppDemo,
};
