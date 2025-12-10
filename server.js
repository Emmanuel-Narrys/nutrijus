const express = require('express');
const next = require('next');

const port = 3000;
const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();

    server.all('*', (req, res) => handle(req, res));

    server.listen(port, () => {
        console.log("Ready on port 3000");
    });
});
