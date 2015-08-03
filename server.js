'use strict'

//websocket for signalling
var WebSocketServer = require('ws').Server
var http = require('http');
var express = require('express');
var app = express();

var SERVER_PORT = 3456;

// endpoints
app.get('/online', function (req, res) {
  res.json(online);
});


function iolog(msg) {
  console.log(msg);
}

var online = [];
//Array to store connections
var sockets = [];

var server = http.createServer(app).listen(SERVER_PORT, function() {
    console.log('Express server listening on port ' + SERVER_PORT);
});

var manager = new WebSocketServer({
  server: server
});

//manager.rtc = rtc;

manager.on('connection', function(socket) {
  socket.id = id();
  sockets.push(socket);
  online.push(socket.id);
  socket.send(JSON.stringify({
    myid: true,
    userid: socket.id
  }));

  socket.on('message', function(msg) {
      iolog(msg);
      var json = JSON.parse(msg);
      if(json.to) {
        var soc = getSocket(json.to);
        if(soc) {
          soc.send(msg);
        }
        else {
          console.log("Error: No socket found");
        }
      }
      else {
        console.log(" No 'to' field found");
      }
    });

  socket.on('close', function() {
    // find socket to remove
    var i = sockets.indexOf(socket);
    // remove socket
    sockets.splice(i, 1);
    online.splice(i,1)
  });

});

// generate a 4 digit hex code randomly
function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

// make a REALLY COMPLICATED AND RANDOM id, kudos to dennis
function id() {
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

var getSocket = function(id) {
  var connections = sockets;
  if (!connections) {
    // TODO: Or error, or customize
    return;
  }

  for (var i = 0; i < connections.length; i++) {
    var socket = connections[i];
    if (id === socket.id) {
      return socket;
    }
  }
};
