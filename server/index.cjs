const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 8080;
const app = express();

// Health endpoints
app.get('/healthz', (req, res) => res.status(200).send('ok'));
app.get('/ready', (req, res) => res.status(200).json({ ready: true }));

// Serve static build
const staticDir = path.join(__dirname, '..', 'dist');
app.use(express.static(staticDir, { index: 'index.html' }));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Static server listening on port ${PORT}`);
});
