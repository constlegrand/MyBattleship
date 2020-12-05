var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


var gameNumber = 1;
var userWaiting = [];
var users = {};
var ships = ['a1', 'a2'];
var score = 0;

function isShotOnShip(ships, coord) {
  var result = false;
  for (var i in ships){
    if (coord.toLowerCase() === ships[i].toLowerCase()){
      result = true;
    }
  }
  return result;
}





io.on('connection', (socket) => {
  console.log('user ' + socket.id + ' connected');
  io.emit('chat messages', 'user connected')

  users[socket.id] = {
    id: socket.id,
    roomName: null,
  };


  socket.join('waitingRoom');
  users[socket.id].roomName = 'waitingRoom';
  userWaiting.push(socket);
  if (userWaiting.length >= 2) {
    
    thisRoom = 'game' + gameNumber;

    userWaiting[0].leave('waitingRoom');
    userWaiting[1].leave('waitingRoom');
    userWaiting[0].join(thisRoom);
    userWaiting[1].join(thisRoom);
     
    users[userWaiting[0].id].roomName = thisRoom;
    users[userWaiting[1].id].roomName = thisRoom;
    userWaiting.shift();
    userWaiting.shift();
    io.to('game' + gameNumber).emit('join', 'game' + gameNumber);
    
    gameNumber++;
    
  }




  socket.on('disconnect', () => {
    console.log('user ' + socket.id + ' disconnected');
    io.emit('chat messages', 'user disconnected')
  });

  socket.on('chat messages', (msg) => {
    console.log('message: ' + msg);
  });

  socket.on('chat messages', (msg) => {
    socket.broadcast.to(users[socket.id].roomName).emit('chat messages', msg);
    io.to(socket.id).emit('chat messages', msg);
    if (msg.includes('Fire:')){
      console.log('launch atk');
      var order = msg.trim();
      var array = order.split(' ');
      console.log('locate ' + array[1]);
      if (isShotOnShip(ships, array[1])) {
    socket.broadcast.to(users[socket.id].roomName).emit('chat messages', 'touche');
    io.to(socket.id).emit('chat messages', 'touche');
        score++;
      } else{
    socket.broadcast.to(users[socket.id].roomName).emit('chat messages', 'failed');
    io.to(socket.id).emit('chat messages', 'failed');
      }  

      if (score >= ships.length){
    socket.broadcast.to(users[socket.id].roomName).emit('chat messages', 'u lose');
    io.to(socket.id).emit('chat messages', 'u win');
      }
    }
  });
});


http.listen(3000, () => {
  console.log('listening on *:3000');
});

