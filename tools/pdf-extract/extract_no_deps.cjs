const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const defaultInput = 'c:\\Users\\Kbite\\Documents\\pesquisa\\AetherApp\\individual-pdfs\\index_v10.8.2.pdf';
const input = process.argv[2] || defaultInput;
const outDir = path.resolve(__dirname, '..', '..', 'extracted');
const output = process.argv[3] || path.join(outDir, path.basename(input, path.extname(input)) + '.txt');

fs.mkdirSync(path.dirname(output), { recursive: true });

try {
    const buf = fs.readFileSync(input);
    const latin = buf.toString('latin1');
    const results = new Set();

    const streamRe = /stream\r?\n/gi;
    let match;
    while ((match = streamRe.exec(latin)) !== null) {
        const start = match.index + match[0].length;
        const endIdx = latin.indexOf('endstream', start);
        if (endIdx === -1) continue;
        const chunkLatin = latin.slice(start, endIdx);
        const chunkBuf = Buffer.from(chunkLatin, 'latin1');
        try {
            const dec = zlib.inflateSync(chunkBuf);
            const decStr = dec.toString('utf8');
            // extract parenthesis strings
            const parenRe = /\(([^)\n]{4,})\)/g;
            let m;
            while ((m = parenRe.exec(decStr)) !== null) {
                results.add(m[1].replace(/\\n/g, ' ').trim());
            }
            // extract plaintext runs
            const runRe = /[\x20-\x7E]{6,}/g;
            while ((m = runRe.exec(decStr)) !== null) {
                const s = m[0].trim();
                if (/[A-Za-z0-9]/.test(s)) results.add(s);
            }
        } catch (e) {
            // not zlib-compressed stream; try to extract readable text directly
            const runRe2 = /[\x20-\x7E]{8,}/g;
            let mm;
            while ((mm = runRe2.exec(chunkLatin)) !== null) {
                const s = mm[0].trim();
                if (/[A-Za-z0-9]/.test(s)) results.add(s);
            }
        }
    }

    // fallback: extract readable sequences from whole file
    const fallbackRe = /[\x20-\x7E]{12,}/g;
    let f;
    while ((f = fallbackRe.exec(latin)) !== null) {
        results.add(f[0].trim());
    }

    const out = Array.from(results).join('\n\n');
    fs.writeFileSync(output, out, 'utf8');
    console.log('Wrote extracted text to', output);
} catch (err) {
    console.error('Extraction failed:', err);
    process.exit(1);
}
