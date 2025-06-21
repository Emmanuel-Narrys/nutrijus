const express = require('express');
const next = require('next');

const port = process.env.PORT || 3000
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();

    // Custom route example (optional)
    server.get('/hello', (req, res) => {
        res.send('Hello from custom route!');
    });

    // All other routes handled by Next.js
    server.all('*', (req, res) => {
        return handle(req, res);
    });

    server.listen(port, err => {
        if (err) throw err;
        console.log(`> Ready on http://localhost:${port}`);
    });
});
