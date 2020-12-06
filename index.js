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


function setTurn (player1, player2) {
  turn = Math.random() < 0.5
  users[player1].hisTurn = turn
  users[player2].hisTurn = !turn
   
  if (users[player1].hisTurn = turn) {
    io.to(users[player1].id).emit('chat messages', 'you begin !');
    io.to(users[player2].id).emit('chat messages', 'the foe begin !');
  } else {  
      io.to(users[player2].id).emit('chat messages', 'you begin !');
      io.to(users[player1].id).emit('chat messages', 'the foe begin !');
  }
}

function hastouched(ships, coord) {
  var result = false;
  for (var i in ships){
    if (coord.toLowerCase() === ships[i].toLowerCase()){
      result = true;
    }
  }
  return result;
}

function fireAndMessage(socket, msg) {
  if (msg.includes('Fire:') && users[socket.id].hisTurn ){
    var order = msg.trim().split(' ');
    if (hastouched(users[socket.id].foe.ships, order[1])) {
      socket.broadcast.to(users[socket.id].roomName).emit('chat messages', msg);
      io.to(socket.id).emit('chat messages', msg);
      socket.broadcast.to(users[socket.id].roomName).emit('chat messages', 'Foe hits us !');
      io.to(socket.id).emit('chat messages', 'We hit our foe');
      users[socket.id].score++;
      users[socket.id].foe.ships.splice(users[socket.id].foe.ships.indexOf(order[1]),1);

    } else{
      socket.broadcast.to(users[socket.id].roomName).emit('chat messages', 'Foe failed');
      io.to(socket.id).emit('chat messages', 'We failed');
    } 
    users[socket.id].hisTurn = false;
    users[socket.id].foe.hisTurn = true;

  } else if (msg.includes('Fire:') && !users[socket.id].hisTurn) {
     io.to(socket.id).emit('chat messages', 'hold on, still not your turn'); 
  } else {
      socket.broadcast.to(users[socket.id].roomName).emit('chat messages','Foe : ' + msg);
      io.to(socket.id).emit('chat messages','Me : ' + msg);

  }

}
function isWinner(socket) { 
  if (users[socket.id].foe.ships.length < 1){
    socket.broadcast.to(users[socket.id].roomName).emit('chat messages', 'u lose');
    io.to(socket.id).emit('chat messages', 'u win');
  }
}

function setFoe(user, userfoe) {
  users[user].foe = users[userfoe];
}
    

io.on('connection', (socket) => {
  console.log('user ' + socket.id + ' connected');
  io.emit('chat messages', 'user connected')

  users[socket.id] = {
    id: socket.id,
    roomName: null,
    ships: ships,
    score: 0,
    hisTurn: false,
    foe: null,
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
    setFoe(userWaiting[0].id, userWaiting[1].id);
    setFoe(userWaiting[1].id, userWaiting[0].id);
    setTurn(userWaiting[1].id, userWaiting[0].id);
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
    fireAndMessage(socket, msg);
    isWinner(socket);
  });
});


http.listen(3000, () => {
  console.log('listening on *:3000');
});

