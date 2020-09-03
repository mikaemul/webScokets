'use strict';

const express = require('express');
const { disconnect } = require('process');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const formatMessage = require('./utils/messages');
const {userJoin,getCurrentUser,getRoomUsers,userLeave } = require('./utils/users');

app.use(express.static('public'));

const botName = 'ChatBot';

io.on('connection', (socket) =>{
  socket.on('joinRoom', ({username,room}) =>{
    const user = userJoin(socket.id,username,room);

    socket.join(user.room);

     //welcome user to chat
  socket.emit('message',formatMessage(botName,'Welcome to the chat!'));

  //Broadcast when user connects
  socket.broadcast
    .to(user.room)
    .emit(
      'message',
      formatMessage(botName, `${user.username} has joined the chat.`)
      );

      //send users and room info
      io.to(user.room).emit('roomUsers',{
        room: user.room,
        users: getRoomUsers(user.room)
      });
  });

  //lisen for chat message
  socket.on('chat message', (msg)=>{

    const user = getCurrentUser(socket.id);
    io.to(user.room).emit('message',formatMessage(user.username,msg));
  });


  //when user disconnects
  socket.on('disconnect', ()=>{

    const user = userLeave(socket.id);

    if(user){
      io.to(user.room).emit('message',formatMessage(botName, `${user.username} has left the chat.`));
      
      //send users and room info
      io.to(user.room).emit('roomUsers',{
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }


   
  });

});




http.listen(3000, () => {
  console.log('listening on port 3000');
});
