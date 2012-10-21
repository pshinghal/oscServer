/*
oscServer execution:
node oscServer.js [clientHost] [clientPort] [remoteHost] [remotePort]
Unless clientHost, clientPort, remoteHost and remotePort are specified, the
program defaults to specified values
*/

var net = require('net');
var dgram = require('dgram');

var messageQueue = [];
var CLIENT_HOST = process.argv[2] || "127.0.0.1";
var CLIENT_PORT = process.argv[3] || 41234;
var REMOTE_HOST = process.argv[4] || "animatedsoundworks.com";
var REMOTE_PORT = process.argv[5] || 8001;

var socket = net.connect(REMOTE_PORT, REMOTE_HOST);
var client = dgram.createSocket("udp4");

// Periodically clears queue to a specified host and port
(function (timeout, clientHost, clientPort) {
	function clearQueue() {
		var buffMessage = "";
		if (messageQueue.length > 0) {
			buffMessage = messageQueue.shift();
			client.send(buffMessage, 0, buffMessage.length, clientPort, clientHost, function (err, bytes) {
				console.log("calling it again");
				clearQueue();
			});
		} else {
			setTimeout(clearQueue, timeout);
		}
	}
	clearQueue();
}(100, CLIENT_HOST, CLIENT_PORT));

// Add a connect listener
socket.on('connect', function () {
	console.log('Client has connected to the server!');
});

// Add a data listener
socket.on('data', function (data) {
	var i, charArray = [];
	messageQueue.push(data);
	console.log('Received a message from the server!', data);
	data.forEach(function (byte) {
		charArray.push(String.fromCharCode(byte));
	});
	console.log(charArray.join(""));
});

// Add a disconnect listener
socket.on('disconnect', function () {
	// Shouldn't this be "SERVER has disconnected"?
	console.log('The client has disconnected!');
});

// Sends a message to the server via sockets
function sendMessageToServer(message) {
	socket.send(message);
}