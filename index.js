const express = require('express');
const app = express();
const http = require('http');
const adminMode = require('./scripts/adminMode');
const server = http.createServer(app);
const io = require('socket.io')(server);
const handler = require('./scripts/app');

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('user connected');

    socket.on('command', (msg) => {
        adminMode.executeInAdminMode(msg)
        io.emit('response', msg);
    })
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});

adminMode.executePreCommands();