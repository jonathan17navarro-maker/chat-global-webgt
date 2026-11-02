// server.js - Servidor de chat y WebRTC en tiempo real
const express = require('express');
const http = http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const users = {};

io.on('connection', (socket) => {
    console.log(Nuevo usuario conectado: ${socket.id});

    // Registro de usuario
    socket.on('register_user', (userData) => {
        users[socket.id] = {
            id: socket.id,
            username: userData.username || Usuario_${socket.id.substr(0,4)},
            theme: userData.theme || { background: '#1e293b', font: 'Segoe UI' }
        };
        io.emit('update_user_list', Object.values(users));
        // Notificar a los demás que alguien nuevo entró
        socket.broadcast.emit('user_joined', socket.id);
    });

    // Mensajería general (texto, stickers, archivos)
    socket.on('send_message', (data) => {
        io.emit('receive_message', {
            senderId: socket.id,
            senderName: users[socket.id]?.username || 'Anónimo',
            type: data.type,
            content: data.content,
            timestamp: new Date().toLocaleTimeString()
        });
    });

    // --- SEÑALIZACIÓN WEBRTC (VIDEOCALL) ---
    socket.on('offer', (data) => {
        io.to(data.target).emit('offer', {
            offer: data.offer,
            sender: socket.id
        });
    });

    socket.on('answer', (data) => {
        io.to(data.target).emit('answer', {
            answer: data.answer,
            sender: socket.id
        });
    });

    socket.on('candidate', (data) => {
        io.to(data.target).emit('candidate', {
            candidate: data.candidate,
            sender: socket.id
        });
    });
    // ----------------------------------------

    // Desconexión
    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('update_user_list', Object.values(users));
        io.emit('user_disconnected', socket.id);
        console.log(Usuario desconectado: ${socket.id});
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(Servidor corriendo en el puerto ${PORT});
});