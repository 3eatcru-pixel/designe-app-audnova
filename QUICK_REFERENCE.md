/**
 * AudNova V22.0 - QUICK REFERENCE GUIDE
 * APIs, Hooks, Services, and Usage Examples
 */

## 🎯 QUICK START IN 5 MINUTES

### 1. Wrap Your App (Already Done)
```typescript
// src/main.tsx
import { AudNovaProvider } from './context/AudNovaContext';

<AudNovaProvider>
  <App />
</AudNovaProvider>
```

### 2. Use Services in Components
```typescript
import { useAudNova, useRadioService, useMessageService } from './context/AudNovaContext';

export function ChatApp() {
  const { isInitialized, userId } = useAudNova();
  const radioService = useRadioService();
  
  // Access radio channels
  const channels = radioService.listChannels();
  
  // You're ready!
}
```

---

## 📚 COMPLETE API REFERENCE

### 🎤 RADIO SERVICE

```typescript
// Create a channel
const channel = radioService.createChannel({
  name: 'My Radio',
  description: 'Description here',
  category: 'music',
  creatorId: userId,
});

// Join a channel
radioService.joinChannel('channel-id', userId);

// Get channels
const channels = radioService.listChannels();

// Start transmitting
radioService.startTransmit('channel-id', audioData);

// Stop transmitting
radioService.stopTransmit('channel-id');

// Get channel participants
const participants = radioService.getChannelParticipants('channel-id');
```

### 💬 MESSAGE SERVICE

```typescript
// Create thread
const thread = messageService.createP2PThread('peer-id');
const thread2 = messageService.createChannelThread('channel-id');

// Send message (auto-encrypted)
const msg = await messageService.sendMessage(
  threadId,
  'Hello world!',
  userId
);

// Get messages
const messages = messageService.getThreadMessages(threadId);

// Search
const results = messageService.searchMessages(threadId, 'query');

// Update delivery status
messageService.updateDeliveryStatus(messageId, 'READ');

// Add reaction
messageService.addReaction(messageId, '👍', userId);

// Typing indicator
messageService.setTypingIndicator(threadId, userId, true);

// Backup/restore
const backup = messageService.exportThreads();
messageService.importThreads(backup);
```

### 🔐 RATCHET SERVICE (E2EE)

```typescript
// Initialize E2EE session
const session = await ratchetService.initSession('peer-id', peerPublicKey);

// Encrypt message
const encrypted = await ratchetService.encryptMessage(sessionId, plaintext);

// Decrypt message
const plaintext = await ratchetService.decryptMessage(sessionId, encrypted);

// Forward secrecy: each message auto-updates keys
// (Automatic on send/receive)
```

### 👤 IDENTITY SERVICE

```typescript
// Generate new identity
const identity = identityService.generateIdentity();

// Export seed (BIP39)
const mnemonic = identityService.exportSeed();

// Verify identity
const valid = identityService.verifyIdentity(publicKey);

// Get DID certificate
const did = identityService.getDIDCertificate();

// Derive child keys
const childKey = identityService.deriveChildKey(path);
```

### 🎙️ AUDIO SERVICE

```typescript
// Encode PCM to Opus
const opusFrame = audioService.encodeAudio(pcmData);

// Decode Opus to PCM
const pcmData = audioService.decodeAudio(opusFrame);

// Get codec info
const info = audioService.getCodecInfo();

// Jitter buffer
const sample = audioService.getBufferedSample();
```

### 🗄️ STORAGE SERVICE

```typescript
// Save encrypted data
storageService.saveEncrypted('key', { data: 'value' });

// Load encrypted data
const data = storageService.loadEncrypted('key');

// Backup master key
const backup = storageService.backupMasterKey();

// Clear all
storageService.clear();
```

### 🌐 MESH ENGINE

```typescript
// Start mesh
meshEngine.start();

// Get neighbors
const neighbors = meshEngine.getNeighbors();

// Route message
meshEngine.routeMessage(peerId, data);

// Get metrics
const stats = meshEngine.getMetrics();

// Stop mesh
await meshEngine.stop();
```

### 📡 TRANSPORT MANAGER

```typescript
// Create with strategy
const manager = new TransportManager(SelectionStrategy.HYBRID);

// Initialize all transports
await manager.initializeTransports();

// Send to peer (auto-selects best transport)
await manager.sendToPeer(peerId, data);

// Broadcast to all
await manager.broadcast(data);

// Get metrics
const metrics = manager.getMetrics();

// Disconnect
await manager.disconnect();
```

---

## 🪝 REACT HOOKS REFERENCE

### useAudNova()
```typescript
const {
  isInitialized,        // boolean
  status,               // 'initializing' | 'bootstrapping' | 'connecting' | 'ready' | 'error'
  userId,               // string
  userSeed,             // string
  node,                 // AudNovaNode instance
  error,                // Error | null
  connect,              // () => Promise<void>
  bootstrap,            // (seed?: string) => Promise<void>
  logout,               // () => void
} = useAudNova();
```

### useRadio()
```typescript
const {
  channels,             // Channel[]
  activeChannel,        // Channel | null
  participants,         // string[]
  isTransmitting,       // boolean
  createChannel,        // (name, description, category) => void
  joinChannel,          // (channelId) => void
  leaveChannel,         // (channelId) => void
  startTransmit,        // () => void
  stopTransmit,         // () => void
} = useRadio(radioService);
```

### useMessage()
```typescript
const {
  messages,             // Message[]
  unreadCount,          // number
  typingUsers,          // string[]
  sendMessage,          // (text) => Promise<void>
  markAsRead,           // (msgId) => void
  addReaction,          // (msgId, emoji, userId) => void
  setTyping,            // (isTyping) => void
  searchMessages,       // (query) => Message[]
} = useMessage(messageService, threadId);
```

### useRatchet()
```typescript
const {
  sessionId,            // string
  isEncrypted,          // boolean
  initSession,          // (peerId, publicKey) => Promise<Session>
  encryptMessage,       // (text) => Promise<Uint8Array>
  decryptMessage,       // (encrypted) => Promise<string>
} = useRatchet(ratchetService, peerId);
```

### useIdentity()
```typescript
const {
  identity,             // Identity
  seed,                 // string
  generateIdentity,     // () => Identity
  exportSeed,           // () => string
  restoreIdentity,      // (seed) => void
  getPublicKey,         // () => Uint8Array
} = useIdentity(identityService);
```

---

## 🧩 COMPONENT EXAMPLES

### Using ChatDeckIntegrated
```typescript
import ChatDeckIntegrated from './pages/ChatDeckIntegrated';

export function MyApp() {
  return <ChatDeckIntegrated />;
}
```

### Using P2PChatIntegrated
```typescript
import P2PChatIntegrated from './pages/P2PChatIntegrated';

export function MyP2PChat() {
  return <P2PChatIntegrated peerId="friend-123" />;
}
```

### Creating a Radio
```typescript
import CreateRadioPage from './pages/CreateRadioPage.improved';

export function RadioCreator() {
  return (
    <CreateRadioPage
      onBack={() => navigate('/home')}
      onCreate={(radio) => console.log('Created:', radio)}
    />
  );
}
```

---

## 📦 SELECTION STRATEGIES

```typescript
import { SelectionStrategy, TransportManager } from './services/TransportManager';

// HYBRID: Use multiple transports (recommended)
new TransportManager(SelectionStrategy.HYBRID);

// FASTEST: Auto-select by signal/latency
new TransportManager(SelectionStrategy.FASTEST);

// WIFI_FIRST: Prefer high bandwidth
new TransportManager(SelectionStrategy.WIFI_FIRST);

// BLE_FIRST: Prefer low power
new TransportManager(SelectionStrategy.BLE_FIRST);

// MOST_RELIABLE: Choose by packet delivery
new TransportManager(SelectionStrategy.MOST_RELIABLE);
```

---

## 🎬 FULL EXAMPLE APP

```typescript
import React, { useEffect, useState } from 'react';
import { useAudNova, useRadioService, useMessageService } from './context/AudNovaContext';
import ChatDeckIntegrated from './pages/ChatDeckIntegrated';

export default function FullExample() {
  const { isInitialized, userId, bootstrap } = useAudNova();
  const radioService = useRadioService();
  const messageService = useMessageService();
  const [peers, setPeers] = useState([]);

  useEffect(() => {
    // Bootstrap on mount
    bootstrap();
  }, []);

  if (!isInitialized) {
    return <div>Initializing AudNova...</div>;
  }

  return (
    <div>
      <h1>AudNova V22.0</h1>
      <p>Your ID: {userId}</p>
      <ChatDeckIntegrated />
    </div>
  );
}
```

---

## ⚠️ COMMON PATTERNS

### Wait for Initialization
```typescript
const { isInitialized } = useAudNova();

if (!isInitialized) {
  return <LoadingSpinner />;
}

// Safe to use services now!
```

### Error Handling
```typescript
try {
  await messageService.sendMessage(threadId, text, userId);
} catch (error) {
  console.error('Send failed:', error);
  // Fallback to queue or retry
}
```

### Message Polling
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    const messages = messageService.getThreadMessages(threadId);
    setMessages(messages);
  }, 500);

  return () => clearInterval(interval);
}, [threadId]);
```

### Peer Discovery
```typescript
const { getActivePeers } = useAudNova();

const peers = getActivePeers();
console.log(`Found ${peers.length} peers`);
```

---

## 🚀 TESTING

```typescript
// Run tests
npm test -- MessageService.test.ts

// Test with mock data
const mockService = new MockTransport();
await mockService.startScanning();

// Demo transports
import { demonstrateTransports } from './services/TransportIntegrationExample';
await demonstrateTransports();
```

---

## 📊 STATUS CODES

### Message Delivery Status
- `SENT` - Message sent to peer
- `DELIVERED` - Peer received message
- `READ` - Peer read message

### Node Status
- `initializing` - Starting up
- `bootstrapping` - Creating/loading identity
- `connecting` - Joining mesh
- `ready` - Ready to use
- `error` - Something went wrong

### Transport Status
- `idle` - Not scanning
- `scanning` - Looking for peers
- `connecting` - Establishing connection
- `connected` - Ready to send/receive

---

## 🔒 SECURITY NOTES

1. **Never expose seeds** - Treat like passwords
2. **Enable E2EE** - Always initialize ratchet before messaging
3. **Verify identities** - Check DIDs on important peers
4. **Backup keys** - Use StorageService backup feature
5. **Update transports** - Keep BLE/WiFi stacks current

---

## 📞 DEBUGGING

```typescript
// Check initialization
const { isInitialized, status } = useAudNova();
console.log('Status:', status);

// Check transports
const manager = new TransportManager();
const metrics = manager.getMetrics();
console.log('Transports:', metrics);

// Check messages
const messages = messageService.getThreadMessages(threadId);
console.log('Messages:', messages.length);

// Check mesh
const stats = meshEngine.getMetrics();
console.log('Mesh stats:', stats);
```

---

## ✅ CHECKLIST FOR NEW FEATURES

- [ ] Use `useAudNova()` to get services
- [ ] Check `isInitialized` before using services
- [ ] Handle errors with try/catch
- [ ] Clean up subscriptions/intervals
- [ ] Test with mock data first
- [ ] Test with real transports
- [ ] Check TypeScript strict mode
- [ ] Add JSDoc comments

---

*Last Updated: April 7, 2026*
*For full docs, see PROJECT_COMPLETION_SUMMARY.md and TRANSPORT_GUIDE.md*
