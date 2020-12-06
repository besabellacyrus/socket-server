const app = require('express')();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  origins: '*:*',    
  transports: ['websocket', 'polling'],
});

// const io = require('socket.io')(http, {
//   origins: '*:*',
//   transports: ['polling'],
//   pingInterval: 10000,
//   pingTimeout: 5000,
//   cookie: false,
// }); 

const port = 3000;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); 
  next();
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
  console.log('weee');
});

const sessionsMap = {};
const riders = {};

io.on('connection', (socket) => {
  console.log('a user connected');
  io.to(socket.id).emit('myId', socket.id);
  io.emit('ows', 1);

  socket.on('userIdReceived', (userId) => {
    sessionsMap[userId] = socket.id;
    io.to(socket.id).emit('succesRegisteer', sessionsMap);
  }); 

  socket.on('book', (e) => {
    console.log('has a book', e);
    socket.broadcast.emit('riderBook', e);
  });
  socket.on('forPickup', (e) => {
    const socketId = sessionsMap[e.customerId];
    io.to(socketId).emit('forPickup', e);
  });
  socket.on('pickedup', (e) => {
    const socketId = sessionsMap[e.customerId];
    io.to(socketId).emit('isPickedUp', e);
  });
  // create a online rider coord broadcast
  socket.on('coordsRider', (e) => { 
    riders[e.riderId] = { socketId: socket.id, ...e };
    socket.broadcast.emit('broadcastRidersCoords', riders);
    io.emit('activeRiders', riders);
  });
  socket.on('completed', (e) => {
    const socketId = sessionsMap[e.customerId];
    io.to(socketId).emit('isCompleted', e);
  });
  socket.on('confirmDelivery', (e) => {
    const socketId = sessionsMap[e.customerId];
    io.to(socketId).emit('acceptBook', e);
  });
  socket.on('sendCoord', (e) => {
    const socketId = sessionsMap[e.customerId];
    io.to(socketId).emit('riderCoord', e);
  });
  socket.on('disconnect', (e) => {
    console.log('user disconnected', e);
  });
});
http.listen(port, () => {
  console.log('listening on *: ' + port);
});
