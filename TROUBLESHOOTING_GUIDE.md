# AudNova V22.0 - Troubleshooting Guide

Comprehensive troubleshooting guide for common issues and solutions.

---

## 🔴 Critical Issues

### 1. BLE Connection Fails on iOS

**Symptoms**:
- "Web Bluetooth API not available" error
- Connection timeouts on iOS devices
- Characteristic read/write fails

**Root Causes**:
1. HTTPS required (not http://)
2. iOS requires user interaction before BLE connection
3. Missing permissions in app manifest

**Solutions**:

```typescript
// src/services/BleTransport.ts
export class BleTransport {
  async connect(device: BluetoothDevice) {
    // Wrap in user gesture for iOS compliance
    const handleUserGesture = async () => {
      // This MUST be called from a user interaction
      const server = await device.gatt.connect();
      return server;
    };

    // On iOS, request must come from user gesture
    if (navigator.userAgent.includes('iPhone') || 
        navigator.userAgent.includes('iPad')) {
      // Ensure HTTPS
      if (location.protocol !== 'https:') {
        console.error('HTTPS required for BLE on iOS');
        return;
      }

      // User gesture is required
      return handleUserGesture();
    }

    return device.gatt.connect();
  }

  async getCharacteristic(service: string, characteristic: string) {
    try {
      const gattService = await this.server.getPrimaryService(service);
      return await gattService.getCharacteristic(characteristic);
    } catch (error) {
      if (error instanceof Error && error.message.includes('GATT operation already in progress')) {
        // Queue requests to avoid race condition
        await new Promise(resolve => setTimeout(resolve, 100));
        return this.getCharacteristic(service, characteristic);
      }
      throw error;
    }
  }
}
```

**Checklist**:
- [ ] Deployed with HTTPS
- [ ] BLE requested from user interaction (button click, etc.)
- [ ] iOS app has `NSBluetoothPeripheralUsageDescription` in manifest
- [ ] Test on actual iOS device (simulator may not work)

---

### 2. WiFi WebSocket Fails Node v20+

**Symptoms**:
- "WebSocket is not defined" error
- WebSocket connections fail on server
- Connection refused on localhost:3001

**Root Causes**:
- Node.js v17+ requires explicit import
- Port already in use
- Firewall blocking WebSocket

**Solutions**:

```typescript
// server/index.cjs - Use correct imports
// Node v20+ requires commonjs-compatible approach
const http = require('http');
const WebSocket = require('ws');  // Install: npm install ws

// Create HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server active');
});

// Attach WebSocket
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', (data) => {
    // Broadcast to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(process.env.WS_PORT || 3001, () => {
  console.log('WebSocket server listening on port 3001');
});
```

**Browser Side**:

```typescript
// src/services/WifiTransport.ts
export class WifiTransport {
  connect(url: string): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(url);
        
        ws.onopen = () => {
          console.log('WebSocket connected');
          resolve(ws);
        };

        ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          reject(event);
        };

        // Set timeout
        setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            ws.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 5000);

      } catch (error) {
        reject(error);
      }
    });
  }

  send(data: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws.send(data);
        resolve();
      } catch (error) {
        if (this.ws.readyState === WebSocket.CLOSED) {
          // Reconnect
          this.connect(this.url).then(() => this.send(data));
        } else {
          reject(error);
        }
      }
    });
  }
}
```

**Checklist**:
- [ ] Port 3001 not in use: `lsof -i :3001`
- [ ] Firewall allows port 3001
- [ ] `ws` package installed: `npm install ws`
- [ ] Server running: `node server/index.cjs`
- [ ] Environment variable set: `WS_URL=ws://localhost:3001`

---

### 3. E2EE Keys Not Persisting

**Symptoms**:
- Keys reset on reload
- Chat history lost
- Messages become unreadable

**Root Causes**:
- IndexedDB not initialized
- Storage quota exceeded
- Private key not encrypted in storage

**Solutions**:

```typescript
// src/services/StorageService.ts
export class StorageService {
  private static DB_NAME = 'AudNova';
  private static DB_VERSION = 1;
  private static ENCRYPT_PASSWORD = 'local-encryption-key';

  async initializeDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB failed to open');
        reject(request.error);
      };

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('identity')) {
          const identityStore = db.createObjectStore('identity', { keyPath: 'id' });
          identityStore.createIndex('publicKeyIndex', 'publicKey', { unique: true });
        }

        if (!db.objectStoreNames.contains('messages')) {
          const msgStore = db.createObjectStore('messages', { keyPath: 'id' });
          msgStore.createIndex('fromIndex', 'from', { unique: false });
          msgStore.createIndex('timestampIndex', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('keys')) {
          db.createObjectStore('keys', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  async storePrivateKey(privateKey: CryptoKey, password: string) {
    const db = await this.initializeDB();
    const tx = db.transaction(['keys'], 'readwrite');
    const store = tx.objectStore('keys');

    // Export key for storage
    const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
    
    // Encrypt before storing
    const encrypted = await this.encryptData(
      new Uint8Array(exported),
      password
    );

    return new Promise((resolve, reject) => {
      const request = store.put({
        id: 'private-key',
        data: encrypted,
        timestamp: Date.now(),
      });

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async retrievePrivateKey(password: string): Promise<CryptoKey | null> {
    const db = await this.initializeDB();
    const tx = db.transaction(['keys'], 'readonly');
    const store = tx.objectStore('keys');

    return new Promise((resolve, reject) => {
      const request = store.get('private-key');

      request.onsuccess = async () => {
        try {
          const result = request.result;
          if (!result) {
            resolve(null);
            return;
          }

          // Decrypt the stored key
          const decrypted = await this.decryptData(result.data, password);

          // Import as crypto key
          const key = await crypto.subtle.importKey(
            'pkcs8',
            decrypted.buffer,
            {
              name: 'ECDSA',
              namedCurve: 'P-256',
            },
            false,
            ['sign']
          );

          resolve(key);
        } catch (error) {
          reject(error);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async encryptData(data: Uint8Array, password: string): Promise<Uint8Array> {
    // Derive key from password
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const key = await crypto.subtle.importKey('raw', derivedBits, 'AES-GCM', false, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encrypted = await crypto.subtle.encrypt('AES-GCM', key, data);

    // Combine salt + iv + encrypted
    const result = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);
    result.set(salt);
    result.set(iv, salt.byteLength);
    result.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength);

    return result;
  }

  private async decryptData(data: Uint8Array, password: string): Promise<Uint8Array> {
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 28);
    const encrypted = data.slice(28);

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const key = await crypto.subtle.importKey('raw', derivedBits, 'AES-GCM', false, ['decrypt']);

    const decrypted = await crypto.subtle.decrypt('AES-GCM', key, encrypted);
    return new Uint8Array(decrypted);
  }
}
```

**Checklist**:
- [ ] IndexedDB enabled in browser
- [ ] Private key encrypted with secure password
- [ ] Check storage quota: `navigator.storage.estimate()`
- [ ] Clear cache properly on logout
- [ ] Test persistence with reload

---

## 🟡 Warning Issues

### 4. High Memory Usage (> 100MB)

**Symptoms**:
- App becomes sluggish after 30+ minutes
- Browser crashes with huge message history
- Memory not released during chat

**Root Causes**:
- Message history not garbage collected
- Event listeners not removed
- Large buffers stored in memory

**Solutions**:

```typescript
// src/hooks/useMessageHistory.ts
export function useMessageHistory() {
  const [messages, setMessages] = useState<Message[]>([]);
  const maxMessages = 1000; // Keep only last 1000 messages

  const addMessage = useCallback((msg: Message) => {
    setMessages(prev => {
      const updated = [...prev, msg];
      
      // Keep only recent messages
      if (updated.length > maxMessages) {
        const removed = updated.splice(0, updated.length - maxMessages);
        
        // Archive older messages to IndexedDB
        archiveMessages(removed);
        
        return updated;
      }
      
      return updated;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setMessages([]); // Clear messages
    };
  }, []);

  return { messages, addMessage };
}

// Memory monitoring
export function useMemoryMonitoring() {
  useEffect(() => {
    const interval = setInterval(() => {
      if ((performance.memory?.usedJSHeapSize || 0) > 100 * 1024 * 1024) {
        console.warn('High memory usage detected');
        // Trigger garbage collection if possible
        if (global.gc) global.gc();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);
}
```

**Monitor Usage**:
```javascript
// Run in browser console
setInterval(() => {
  const mem = performance.memory;
  console.log(`Used: ${(mem.usedJSHeapSize / 1048576).toFixed(1)}MB / ${(mem.jsHeapSizeLimit / 1048576).toFixed(1)}MB`);
}, 1000);
```

---

### 5. Slow Message Delivery (> 500ms)

**Symptoms**:
- Lag when sending messages
- Encryption takes > 200ms
- UI freezes during send

**Root Causes**:
- Crypto operations on main thread
- Large message batches
- Poor network conditions

**Solutions**:

```typescript
// Offload to Web Worker
// src/services/crypto-worker.ts
self.onmessage = async (event) => {
  const { action, data, key } = event.data;

  try {
    switch (action) {
      case 'encrypt':
        const encrypted = await crypto.subtle.encrypt(
          'AES-GCM',
          key,
          data
        );
        self.postMessage({ success: true, result: encrypted });
        break;

      case 'decrypt':
        const decrypted = await crypto.subtle.decrypt(
          'AES-GCM',
          key,
          data
        );
        self.postMessage({ success: true, result: decrypted });
        break;
    }
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

// Use in service
export class MessageService {
  private cryptoWorker = new Worker('/crypto-worker.ts');

  async encryptMessage(message: string, key: CryptoKey): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      this.cryptoWorker.onmessage = (e) => {
        if (e.data.success) {
          resolve(e.data.result);
        } else {
          reject(new Error(e.data.error));
        }
      };

      this.cryptoWorker.postMessage({
        action: 'encrypt',
        data: new TextEncoder().encode(message),
        key,
      });
    });
  }
}
```

---

## 🟢 Minor Issues

### 6. Chat Messages Not Sync Across Tabs

**Symptoms**:
- Open same app in 2 tabs
- Message sent in tab 1 not visible in tab 2
- Out of sync state

**Solutions**:

```typescript
// src/hooks/useSharedState.ts
export function useSharedState<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => {
    // Load from sessionStorage
    const stored = sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  // Sync across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setState(JSON.parse(e.newValue));
      }
    };

    // Listen to storage events from other tabs
    window.addEventListener('storage', handleStorageChange);

    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  // Update both state and storage
  const setSharedState = useCallback((newValue: T) => {
    setState(newValue);
    sessionStorage.setItem(key, JSON.stringify(newValue));

    // Notify other tabs
    window.dispatchEvent(
      new StorageEvent('storage', {
        key,
        newValue: JSON.stringify(newValue),
      })
    );
  }, [key]);

  return [state, setSharedState] as const;
}
```

---

### 7. Build Fails with TypeScript Errors

**Symptoms**:
- `npm run build` fails
- Type errors in console
- `tsc --noEmit` shows errors

**Quick Fixes**:

```bash
# Check for type errors
npx tsc --noEmit

# Fix common issues
npm install --save-dev @types/node @types/react @types/react-dom

# Update TypeScript version
npm install typescript@latest

# Clear cache and rebuild
rm -rf node_modules .next dist
npm install
npm run build
```

---

## 📊 Diagnostics

### Check Browser Compatibility

```typescript
// src/utils/diagnostics.ts
export function checkBrowserSupport() {
  const support = {
    webCrypto: !!globalThis.crypto?.subtle,
    webBluetooth: !!navigator.bluetooth,
    webWorkers: typeof Worker !== 'undefined',
    indexedDB: !!globalThis.indexedDB,
    serviceWorker: 'serviceWorker' in navigator,
    webAssembly: !!globalThis.WebAssembly,
    webRTC: !!(
      globalThis.RTCPeerConnection ||
      (globalThis as any).webkitRTCPeerConnection
    ),
  };

  console.table(support);
  return support;
}

// Run diagnostics
export function runDiagnostics() {
  console.log('=== AudNova Diagnostics ===');
  console.log('Browser:', navigator.userAgent);
  console.log('Support:', checkBrowserSupport());
  console.log('Memory:', performance.memory);
  console.log('Connection:', navigator.connection);
}
```

---

## 🆘 Getting Help

### Enable Debug Logging

```typescript
// src/utils/logger.ts
const DEBUG = true;

export const logger = {
  debug: (...args: any[]) => DEBUG && console.debug('[DEBUG]', ...args),
  info: (...args: any[]) => console.info('[INFO]', ...args),
  warn: (...args: any[]) => console.warn('[WARN]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
};

// Use throughout codebase
logger.debug('Message service initialized');
logger.error('Connection failed:', error);
```

### Collect System Information

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check installed packages
npm list

# Check for vulnerabilities
npm audit
```

---

## ✅ Verification Checklist

After fixing any issue:

- [ ] Clear browser cache: Ctrl+Shift+Delete
- [ ] Close all tabs and restart browser
- [ ] Test in incognito/private mode
- [ ] Test on different device
- [ ] Check browser console for errors
- [ ] Verify all features still work
- [ ] Run `npm run build` successfully
- [ ] Deploy to test environment

---

*Last Updated: April 7, 2026*
