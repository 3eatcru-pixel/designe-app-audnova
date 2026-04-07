/**
 * AudNova V22.0 - Integrated ChatDeck Page
 * Chat deck integrado com RadioService + MessageService
 * Baseado na engenharia Aether Elite V10.8.2
 */

import React, { useState, useEffect } from 'react';
import { useRadio, useMessage } from '../hooks';
import { useAudNova, useRadioService, useMessageService } from '../context/AudNovaContext';
import { RadioChannel, AudioSegment } from '../types';

/**
 * ChatDeckIntegrated - Versão integrada do ChatDeck
 * Usar RadioService para canais + AudioService para transmissão
 */
export default function ChatDeckIntegrated() {
    const { isInitialized, status, error, userId } = useAudNova();
    const radioService = useRadioService();
    const messageService = useMessageService();

    // Estado de UI
    const [activeTab, setActiveTab] = useState<'channels' | 'audio' | 'messages'>('channels');
    const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

    // Hooks
    const {
        activeChannel,
        channels,
        isTransmitting,
        createChannel: createRadioChannel,
        joinChannel: joinRadio,
        listChannels,
        startTransmit,
        stopTransmit,
    } = useRadio(radioService);

    const { messages, unreadCount, sendMessage, setTyping, search } = useMessage(messageService, selectedThreadId);

    // State local
    const [newChannelName, setNewChannelName] = useState('');
    const [messageText, setMessageText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Refresh channels on mount
    useEffect(() => {
        if (radioService) {
            listChannels();
        }
    }, [radioService]);

    // Load/create thread quando channel é selecionado
    useEffect(() => {
        if (messageService && selectedChannelId) {
            const thread = messageService.getThread(`channel-${selectedChannelId}`);
            if (thread) {
                setSelectedThreadId(thread.id);
            }
        }
    }, [selectedChannelId, messageService]);

    // Handlers
    const handleCreateChannel = async () => {
        if (newChannelName.trim()) {
            await createRadioChannel(newChannelName, true);
            setNewChannelName('');
        }
    };

    const handleJoinChannel = async (channelId: string) => {
        await joinRadio(channelId);
        setSelectedChannelId(channelId);
    };

    const handleSendMessage = async () => {
        if (messageText.trim() && selectedThreadId) {
            await sendMessage(messageText);
            setMessageText('');
        }
    };

    const handleSearchMessages = () => {
        if (selectedThreadId) {
            const results = search(searchQuery);
            setSearchResults(results);
        }
    };

    // Check initialization
    if (status === 'initializing') {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>🔄 Initializing AudNova...</p>
            </div>
        );
    }

    if (!isInitialized) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
                <p>❌ AudNova not initialized</p>
                {error && <p>Error: {error}</p>}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
            {/* Sidebar - Channel List */}
            <div
                style={{
                    width: '300px',
                    borderRight: '1px solid #ddd',
                    overflowY: 'auto',
                    padding: '10px',
                }}
            >
                <h2>🎙️ Channels</h2>
                <p style={{ fontSize: '0.9em', color: '#999' }}>User: {userId}</p>

                {/* Create Channel */}
                <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f9f9f9' }}>
                    <input
                        type="text"
                        placeholder="New channel..."
                        value={newChannelName}
                        onChange={(e) => setNewChannelName(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                                handleCreateChannel();
                            }
                        }}
                        style={{ width: '100%', padding: '5px', marginBottom: '5px' }}
                    />
                    <button
                        onClick={handleCreateChannel}
                        style={{
                            width: '100%',
                            padding: '8px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        + Create
                    </button>
                </div>

                {/* Channel List */}
                <div>
                    <h3>Available ({channels.length})</h3>
                    {channels.length === 0 ? (
                        <p style={{ color: '#999' }}>No channels yet</p>
                    ) : (
                        <ul
                            style={{
                                listStyle: 'none',
                                padding: 0,
                                margin: 0,
                            }}
                        >
                            {channels.map((ch) => (
                                <li
                                    key={ch.id}
                                    onClick={() => handleJoinChannel(ch.id)}
                                    style={{
                                        padding: '10px',
                                        marginBottom: '5px',
                                        backgroundColor:
                                            selectedChannelId === ch.id ? '#e3f2fd' : '#f5f5f5',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        border: selectedChannelId === ch.id ? '2px solid #2196F3' : 'none',
                                    }}
                                >
                                    <div style={{ fontWeight: selectedChannelId === ch.id ? 'bold' : 'normal' }}>
                                        {ch.name} {ch.isEncrypted ? '🔒' : ''}
                                    </div>
                                    <small style={{ color: '#999' }}>
                                        {ch.participants.size} participants
                                    </small>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ padding: '15px', borderBottom: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            {activeChannel ? (
                                <div>
                                    <h2 style={{ margin: 0 }}>
                                        🎙️ {activeChannel.name}
                                        {isTransmitting && (
                                            <span style={{ color: 'red', marginLeft: '10px' }}>● LIVE</span>
                                        )}
                                    </h2>
                                    <small style={{ color: '#999' }}>
                                        {activeChannel.participants.size} participants
                                    </small>
                                </div>
                            ) : (
                                <p>Select a channel to start chatting</p>
                            )}
                        </div>

                        {/* Transmission Controls */}
                        {activeChannel && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {!isTransmitting ? (
                                    <button
                                        onClick={() => startTransmit()}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#ff5252',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        🎤 Go Live
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => stopTransmit()}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#f44336',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        ⏹ Stop
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setActiveTab('audio')}
                            style={{
                                padding: '8px 15px',
                                backgroundColor: activeTab === 'audio' ? '#2196F3' : '#ddd',
                                color: activeTab === 'audio' ? 'white' : 'black',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '4px',
                            }}
                        >
                            🔊 Audio
                        </button>
                        <button
                            onClick={() => setActiveTab('messages')}
                            style={{
                                padding: '8px 15px',
                                backgroundColor: activeTab === 'messages' ? '#2196F3' : '#ddd',
                                color: activeTab === 'messages' ? 'white' : 'black',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '4px',
                            }}
                        >
                            💬 Messages {unreadCount > 0 && `(${unreadCount})`}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                    {activeTab === 'audio' && (
                        <div>
                            <h3>🎵 Audio Status</h3>
                            {isTransmitting ? (
                                <div style={{ padding: '15px', backgroundColor: '#fff3cd' }}>
                                    <p style={{ color: 'red', fontWeight: 'bold' }}>● TRANSMITTING</p>
                                    <p>Your audio is being broadcast to {activeChannel?.participants.size} participants</p>
                                    <button
                                        onClick={() => stopTransmit()}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#f44336',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Stop Broadcasting
                                    </button>
                                </div>
                            ) : (
                                <div style={{ padding: '15px', backgroundColor: '#f5f5f5' }}>
                                    <p>Click "Go Live" to start transmitting audio</p>
                                    <p style={{ color: '#999', fontSize: '0.9em' }}>
                                        Your audio will be encoded with Opus codec and protected with FEC recovery.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'messages' && (
                        <div>
                            <h3>💬 Channel Messages</h3>

                            {/* Search Bar */}
                            <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Search messages..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                    }}
                                />
                                <button
                                    onClick={handleSearchMessages}
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

                            {/* Messages Display */}
                            <div
                                style={{
                                    backgroundColor: '#f9f9f9',
                                    borderRadius: '4px',
                                    padding: '10px',
                                    minHeight: '300px',
                                }}
                            >
                                {messages.length === 0 ? (
                                    <p style={{ color: '#999', textAlign: 'center' }}>
                                        No messages yet. Start the conversation!
                                    </p>
                                ) : (
                                    messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            style={{
                                                marginBottom: '10px',
                                                padding: '10px',
                                                backgroundColor: 'white',
                                                borderRadius: '4px',
                                                borderLeft: '3px solid #2196F3',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <strong>{msg.senderId}</strong>
                                                <small style={{ color: '#999' }}>
                                                    {new Date(msg.timestamp).toLocaleTimeString()}
                                                    {msg.isEncrypted ? ' 🔒' : ''}
                                                </small>
                                            </div>
                                            <p style={{ margin: '5px 0 0 0' }}>{msg.text}</p>
                                            <small style={{ color: '#999' }}>{msg.deliveryStatus}</small>
                                        </div>
                                    ))
                                )}

                                {/* Search Results */}
                                {searchResults.length > 0 && (
                                    <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#fffacd' }}>
                                        <h4>Search Results ({searchResults.length})</h4>
                                        {searchResults.map((msg) => (
                                            <div key={msg.id} style={{ marginBottom: '5px' }}>
                                                <strong>{msg.senderId}:</strong> {msg.text}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Message Input (if in messages tab) */}
                {activeTab === 'messages' && (
                    <div
                        style={{
                            padding: '15px',
                            borderTop: '1px solid #ddd',
                            display: 'flex',
                            gap: '10px',
                        }}
                    >
                        <input
                            type="text"
                            placeholder="Type a message..."
                            value={messageText}
                            onChange={(e) => {
                                setMessageText(e.target.value);
                                setTyping(e.target.value.length > 0);
                            }}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    handleSendMessage();
                                }
                            }}
                            style={{
                                flex: 1,
                                padding: '10px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                            }}
                        />
                        <button
                            onClick={handleSendMessage}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            Send
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
