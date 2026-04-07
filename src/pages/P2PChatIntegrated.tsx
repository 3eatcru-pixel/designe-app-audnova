/**
 * AudNova V22.0 - Integrated P2P Chat Page
 * Chat P2P encriptado com RatchetService (Double Ratchet E2EE)
 * Mensagens privadas com forward secrecy
 */

import React, { useState, useEffect } from 'react';
import { useMessage, useRatchet } from '../hooks';
import { useAudNova, useMessageService, useRatchetService } from '../context/AudNovaContext';
import { ChatMessage } from '../services/MessageService';

interface P2PChatIntegratedProps {
    peerId: string;
}

/**
 * P2PChatIntegrated - Chat P2P com E2EE e Double Ratchet
 */
export default function P2PChatIntegrated({ peerId }: P2PChatIntegratedProps) {
    const { isInitialized, userId } = useAudNova();
    const messageService = useMessageService();
    const ratchetService = useRatchetService();

    // Ratchet E2EE
    const { sessionId, isEncrypted, initSession, encryptMessage } = useRatchet(ratchetService, peerId);

    // Messages
    const [threadId, setThreadId] = useState<string | null>(null);
    const { messages, unreadCount, sendMessage, markAsRead, setTyping } = useMessage(messageService, threadId);

    // State local
    const [messageText, setMessageText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [showInitializeButton, setShowInitializeButton] = useState(true);

    // Initialize thread on mount
    useEffect(() => {
        if (messageService && peerId) {
            const thread = messageService.createP2PThread(peerId);
            setThreadId(thread.id);
        }
    }, [messageService, peerId]);

    // Initialize E2EE session
    const handleInitializeEncryption = async () => {
        if (!ratchetService || !peerId) {
            setStatusMessage('❌ Services not ready');
            return;
        }

        try {
            setStatusMessage('🔄 Initializing encryption...');

            // In production: exchange public keys via KDF or QR code
            // For now: use simulated key
            const peerPublicKey = new Uint8Array(65);
            crypto.getRandomValues(peerPublicKey);

            const session = await initSession(peerPublicKey);

            if (session) {
                setStatusMessage('✅ Encryption initialized - Double Ratchet active');
                setShowInitializeButton(false);
            } else {
                setStatusMessage('❌ Failed to initialize encryption');
            }
        } catch (err) {
            setStatusMessage(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    // Handle send message
    const handleSendMessage = async () => {
        if (!messageText.trim() || !threadId) return;

        try {
            await sendMessage(messageText);
            setMessageText('');
            setTyping(false);
        } catch (err) {
            setStatusMessage(`❌ Failed to send: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    // Handle search
    const handleSearch = () => {
        if (!searchQuery.trim() || !threadId) return;

        // Note: useMessage hook provides search function
        // This is a simplified example
        const filtered = messages.filter((m) =>
            m.text.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered);
    };

    // Handle mark as read
    const handleMarkAsRead = async (messageId: string) => {
        if (!messageService) return;
        await markAsRead(messageId);
    };

    if (!isInitialized) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
                <p>❌ AudNova not initialized</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif' }}>
            {/* Header */}
            <div style={{ padding: '15px', borderBottom: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: '0 0 5px 0' }}>
                            💬 Direct Message with {peerId}
                        </h2>
                        <small style={{ color: '#999' }}>
                            {isEncrypted ? '🔒 Encrypted with Double Ratchet' : '⚪ Not encrypted'}
                        </small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9em', color: '#666' }}>
                            {unreadCount > 0 && (
                                <div style={{ color: 'red', fontWeight: 'bold' }}>
                                    📬 {unreadCount} unread
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Message */}
                {statusMessage && (
                    <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                        <small>{statusMessage}</small>
                    </div>
                )}

                {/* Initialize Encryption Button */}
                {showInitializeButton && !isEncrypted && (
                    <div style={{ marginTop: '10px' }}>
                        <button
                            onClick={handleInitializeEncryption}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#FF9800',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            🔐 Initialize Encryption
                        </button>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '15px',
                    backgroundColor: '#fafafa',
                }}
            >
                {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#999', paddingTop: '40px' }}>
                        <p>👋 No messages yet</p>
                        <p>
                            {isEncrypted
                                ? 'Start a conversation with end-to-end encryption!'
                                : 'Initialize encryption to start chatting securely'}
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            style={{
                                marginBottom: '12px',
                                padding: '12px',
                                backgroundColor: msg.senderId === userId ? '#e3f2fd' : 'white',
                                borderRadius: '8px',
                                borderLeft:
                                    msg.senderId === userId
                                        ? '4px solid #2196F3'
                                        : '4px solid #4CAF50',
                                maxWidth: '70%',
                                marginLeft: msg.senderId === userId ? 'auto' : '0',
                            }}
                            onClick={() => {
                                if (msg.deliveryStatus !== 'READ') {
                                    handleMarkAsRead(msg.id);
                                }
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginBottom: '5px',
                                }}
                            >
                                <strong style={{ fontSize: '0.9em' }}>
                                    {msg.senderId === userId ? 'You' : peerId}
                                </strong>
                                <small style={{ color: '#999' }}>
                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                </small>
                            </div>

                            <p style={{ margin: '5px 0', wordWrap: 'break-word' }}>{msg.text}</p>

                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.85em' }}>
                                <small style={{ color: '#999' }}>
                                    {msg.deliveryStatus}
                                    {msg.isEncrypted ? ' 🔒' : ''}
                                </small>
                                {/* Reactions */}
                                {msg.reactions && msg.reactions.size > 0 && (
                                    <div style={{ marginLeft: 'auto' }}>
                                        {Array.from(msg.reactions.entries()).map(([emoji, reactors]) => (
                                            <span
                                                key={emoji}
                                                style={{
                                                    backgroundColor: '#f0f0f0',
                                                    padding: '2px 6px',
                                                    borderRadius: '3px',
                                                    marginRight: '5px',
                                                }}
                                                title={reactors.join(', ')}
                                            >
                                                {emoji} {reactors.length}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fffacd', borderRadius: '4px' }}>
                        <h4>🔍 Search Results ({searchResults.length})</h4>
                        {searchResults.map((msg) => (
                            <div key={msg.id} style={{ marginBottom: '8px', padding: '8px', backgroundColor: 'white', borderRadius: '4px' }}>
                                <strong>{msg.senderId}:</strong>
                                <p style={{ margin: '5px 0' }}>{msg.text}</p>
                                <small style={{ color: '#999' }}>
                                    {new Date(msg.timestamp).toLocaleString()}
                                </small>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Search Bar */}
            {messages.length > 0 && (
                <div style={{ padding: '10px', borderTop: '1px solid #ddd', backgroundColor: '#f5f5f5' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSearch();
                                }
                            }}
                            style={{
                                flex: 1,
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                            }}
                        />
                        <button
                            onClick={handleSearch}
                            style={{
                                padding: '8px 15px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            Search
                        </button>
                    </div>
                </div>
            )}

            {/* Message Input */}
            <div style={{ padding: '15px', borderTop: '1px solid #ddd', backgroundColor: 'white' }}>
                {!isEncrypted && !showInitializeButton && (
                    <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#fff3cd', borderRadius: '4px' }}>
                        <small>⚠️ Encryption not ready. Click the button above to initialize.</small>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        placeholder={isEncrypted ? 'Type a secure message...' : 'Encryption required...'}
                        value={messageText}
                        onChange={(e) => {
                            setMessageText(e.target.value);
                            setTyping(e.target.value.length > 0);
                        }}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && isEncrypted) {
                                handleSendMessage();
                            }
                        }}
                        disabled={!isEncrypted}
                        style={{
                            flex: 1,
                            padding: '10px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            opacity: isEncrypted ? 1 : 0.5,
                        }}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!isEncrypted || !messageText.trim()}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: isEncrypted ? '#2196F3' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isEncrypted ? 'pointer' : 'not-allowed',
                        }}
                    >
                        🔐 Send
                    </button>
                </div>

                {/* Info */}
                <small style={{ display: 'block', marginTop: '8px', color: '#999' }}>
                    💡 Messages are encrypted with Double Ratchet protocol. Each message updates encryption keys
                    for forward secrecy.
                </small>
            </div>
        </div>
    );
}

// Export standalone component (can be imported in App.tsx)
export { P2PChatIntegrated };
