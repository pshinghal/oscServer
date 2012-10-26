/*
server execution:
node server.js [localPort]
Unless localPort is specified, the program defaults to 8001
*/
var net = require('net');

var LISTEN_PORT = process.argv[2] || 8001;
var sockets = [];
var netMessageQueue = [];
var currSockId = 0;

// IMPORTANT: Adds field "oscId" to incoming sockets
var server = net.Server(function (socket) {
	socket.oscId = currSockId;
	currSockId += 1;
	sockets.push(socket);

	console.log("Yo ---------------------  : " + socket.toString());

	socket.on('data', function (data) {
		netMessageQueue.push({
			data: data,
			id: socket.oscId
		});
		console.log("Received message from client" + data);
	});

	socket.on('end', function () {
		var i = sockets.indexOf(socket);
		sockets.splice(i, 1);
		console.log("console: dropping client " + i);
	});
});

// Sends to all sockets on list *except* the socket it came from
var sendToClients = function (data, socketIdToSkip) {
	var cleanup = []; // some sockets die without telling us about it.
	var i;
	for (i = 0; i < sockets.length; i += 1) {
		if (sockets[i].oscId === socketIdToSkip)
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
			sendToClients(netMessage.data, netMessage.id);
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
//	sendToClients("time " + t, null);
//};
//setInterval(tfunc, 5000);