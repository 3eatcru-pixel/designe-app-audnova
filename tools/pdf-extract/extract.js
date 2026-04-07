const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

const defaultInput = 'c:\\Users\\Kbite\\Documents\\pesquisa\\AetherApp\\individual-pdfs\\index_v10.8.2.pdf';
const input = process.argv[2] || defaultInput;
const outDir = path.resolve(__dirname, '..', '..', 'extracted');
const output = process.argv[3] || path.join(outDir, path.basename(input, path.extname(input)) + '.txt');

try {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    const dataBuffer = fs.readFileSync(input);
    pdf(dataBuffer).then(function (data) {
        fs.writeFileSync(output, data.text, { encoding: 'utf8' });
        console.log('Extraction complete:', output);
    }).catch(err => {
        console.error('PDF parse error:', err);
        process.exit(1);
    });
} catch (err) {
    console.error('Error reading file or writing output:', err);
    process.exit(1);
}
