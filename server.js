/*
server execution:
node server.js [localPort]
Unless localPort is specified, the program defaults to 8001
*/
var net = require('net');

var LISTEN_PORT = process.argv[2] || 8001;
var socketRooms = {};
var roomsBySocketId = [];
var netMessageQueue = [];
var currSockId = 0;

// TODO: When sockets are dropped, check if room is empty. If so, delete it?

// IMPORTANT: Adds fields "oscId" and "room" to incoming sockets
// IMPORTANT: Expects first message to be the name of the room
var server = net.Server(function (socket) {
	socket.oscId = currSockId;
	currSockId += 1;

	console.log("Yo ---------------------  : " + socket.toString());

	socket.on('data', function (data) {
		var tempText;
		if (socket.oscRoom) {
			netMessageQueue.push({
				data: data,
				id: socket.oscId
			});
			console.log("Received message from client: " + data);
		} else {
			tempText = data.toString();
			console.log("Adding socket to room " + tempText);
			if (!socketRooms[tempText]) {
				socketRooms[tempText] = [];
			}
			socket.oscRoom = tempText;
			socketRooms[tempText].push(socket);
			roomsBySocketId[socket.oscId] = tempText;
		}
	});

	socket.on('end', function () {
		var i = socketRooms[socket.oscRoom].indexOf(socket);
		socketRooms[socket.oscRoom].splice(i, 1);
		console.log("console: dropping client " + i);
	});
});

// Sends to all sockets on list *except* the socket it came from
var sendToClientsInRoom = function (data, senderSocketId) {
	var cleanup = []; // some sockets die without telling us about it.
	var i;
	var roomToSend = roomsBySocketId[senderSocketId];
	var sockets = socketRooms[roomToSend];
	for (i = 0; i < sockets.length; i += 1) {
		if (sockets[i].oscId === senderSocketId)
			continue;

		if (sockets[i].writable) {
			sockets[i].write(data);
		} else {
			cleanup.push(i);
			sockets[i].destroy();
			console.log("Will have to do clean up operation on an impolite socket");
		}
		//TODO: Remove data log
		console.log("Sent to client  " + i + " the data " + data);
	}
	for (i = 0; i < cleanup.length; i += 1) {
		sockets.splice(i, 1);
		console.log("Console: Dropping client " + i);
	}
};

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Periodically clears queue to a specified host and port
(function (timeout) {
	function clearNetQueue() {
		var netMessage = "";
		if (netMessageQueue.length > 0) {
			console.log("clearing messagequeue");
			netMessage = netMessageQueue.shift();
			sendToClientsInRoom(netMessage.data, netMessage.id);
			clearNetQueue();
		} else {
			setTimeout(clearNetQueue, timeout);
		}
	}
	clearNetQueue(timeout);
}(1000));
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

server.listen(LISTEN_PORT);
console.log("Started listening for connections on port " + LISTEN_PORT);

//var t = 0;
//var tfunc = function () {
//	t += 5000;
//	console.log("tick " + t);
//	sendToClientsInRoom("time " + t, null);
//};
//setInterval(tfunc, 5000);