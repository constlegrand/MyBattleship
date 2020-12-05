var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


var gameNumber = 1;
var store = [];



io.on('connection', (socket) => {
  console.log('user ' + socket.id + ' connected');
  io.emit('chat messages', 'user connected')



  socket.join('waitingRoom');

  store.push(socket);
  if (store.length >= 2) {
    console.log(gameNumber);
    console.log('gg waitingroom')
    store[0].leave('waitingRoom');
    store[1].leave('waitingRoom');
    store[0].join('game'+ gameNumber);
    store[1].join('game'+ gameNumber);
    store.shift();
    store.shift();
    io.to('game' + gameNumber).emit('join', 'game' + gameNumber);
    gameNumber++;
    
    //console.log(store[0].id + 'and' + store[1].id + 'are in room : ' + store[0].room);
  }




  socket.on('disconnect', () => {
    console.log('user ' + socket.id + ' disconnected');
    io.emit('chat messages', 'user disconnected')
  });

  socket.on('chat messages', (msg) => {
    console.log('message: ' + msg);
  });

  socket.on('chat messages', (msg) => {
    io.emit('chat messages', msg);
  });
});


http.listen(3000, () => {
  console.log('listening on *:3000');
});

