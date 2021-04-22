const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server);
const handler = require('./scripts/app')
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/scripts')); //Serves resources from public folder

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.use((socket, next) => {
    const cmd = socket.handshake.auth.cmd;
    if (!handler.processCommand(cmd)) {
        return next(new Error("invalid username"));
    }
    socket.username = username;
    next();
});

io.on('connection', (socket) => {
    console.log('user connected');

    const users = [];
    for (let [id, socket] of io.of("/").sockets) {
        users.push({
            userID: id,
            username: socket.username,
        });
    }
    socket.emit("response", users);

    socket.on('cmd', (msg) => {
        io.emit('response', handler.processCommand(msg));
    })
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(3000, () => {
    console.log('listening on *:3000');
});