const fs = require('fs');
const path = require('path');

const input = process.argv[2] || path.resolve(__dirname, '..', '..', 'extracted', 'index_v10.8.2.txt');
const output = process.argv[3] || path.resolve(__dirname, '..', '..', 'extracted', 'index_v10.8.2.cleaned.txt');

try {
    const raw = fs.readFileSync(input, 'utf8');
    // decode hex tokens like <46696c65>
    const decoded = raw.replace(/<([0-9A-Fa-f\s]+)>/g, (m, hex) => {
        const compact = hex.replace(/\s+/g, '');
        try {
            return Buffer.from(compact, 'hex').toString('utf8');
        } catch (e) {
            return m;
        }
    });

    // remove PDF operator tokens and punctuation
    let cleaned = decoded.replace(/\[|\]|TJ|Tm|Tf|\(|\)|\\n/g, ' ');
    cleaned = cleaned.replace(/[\r\n]+/g, '\n');
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    fs.writeFileSync(output, cleaned.trim(), 'utf8');
    console.log('Wrote cleaned output to', output);
} catch (err) {
    console.error('Decode failed:', err);
    process.exit(1);
}
