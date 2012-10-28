/*
oscServer execution:
node oscServer.js [clientHost] [from_clientPort] [to_clientPort] [remoteHost] [remotePort] [roomName]
Unless clientHost, from_clientPort, to_clientPort, remoteHost, remotePort and roomName are specified, the
program defaults to specified values.

This program is a "helper" application that sets up a telnet connection with a server on the net,
and passess messages between the server and a local client using UDP. The network server would 
typically be a chatroom.

The idea is to allow applications that know how to share UDP messages to do so over a WAN 
rather than just a LAN. This is not unlike Ross Bencina's OSCGroups. 
*/

var net = require('net');
var dgram = require('dgram');

var n2cMessageQueue = [];
var c2nMessageQueue = [];

var CLIENT_HOST = process.argv[2] || "192.168.2.2";
var FROM_CLIENT_PORT = process.argv[3] || 51080;
var TO_CLIENT_PORT = process.argv[4] || 51180;
var REMOTE_HOST = process.argv[5] || "animatedsoundworks.com";
var REMOTE_PORT = process.argv[6] || 8001;
var ROOM_NAME = process.argv[7] || "public";

var LENGTH_DIGITS = 4;

var to_clientSocket = dgram.createSocket("udp4");
var from_clientSocket = dgram.createSocket("udp4");

var c2nCounter = 0;
var n2cCounter = 0;

var isRoomConnected = false;

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This section of the code listens for messages from the server on the net,
// and passes the to a local port as UDP messages. 
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Periodically clears queue to a specified host and port
(function (timeout, clientHost, clientPort) {
	function clearN2CQueue() {
		var buffMessage = "";
		if (n2cMessageQueue.length > 0) {
			buffMessage = n2cMessageQueue.shift();
			n2cCounter++;
			to_clientSocket.send(buffMessage, 0, buffMessage.length, clientPort, clientHost, function (err, bytes) {
				console.log(".......NET-2-CLIENT clearQ message #" + n2cCounter + "  being sent to port " + clientPort);
				clearN2CQueue();
			});
		} else {
			setTimeout(clearN2CQueue, timeout);
		}
	}
	clearN2CQueue();
}(10, CLIENT_HOST, TO_CLIENT_PORT));

function splitMessages(message) {
	var messages = [];
	var index = 0;
	var msgLength;
	while (index < message.length) {
		msgLength = parseInt(message.substring(index, index + 4), 10);
		index += 4;
		messages.push(message.substring(index, index + msgLength));
		index += msgLength;
	}
	return messages;
}

function initConnection(netSocket) {
	netSocket.write(ROOM_NAME, "UTF8", function () {
		isRoomConnected = true;
	});
}

var netSocket = net.connect(REMOTE_PORT, REMOTE_HOST, function () {
	initConnection(netSocket);
});

// Add a connect listener
netSocket.on('connect', function () {
	console.log('HelperApp has connected to the net server!');
});

// Add a data listener
netSocket.on('data', function (data) {
	var i, message;
	message = data.toString();
	var messageSet = splitMessages(data.toString());
	for (i = 0; i < messageSet.length; i += 1) {
		n2cMessageQueue.push(new Buffer(messageSet[i]));
	}
	console.log("gotMessage: " + message);
});

// Add a disconnect listener
netSocket.on('end', function () {
	console.log('The set server has disconnected!');
	process.exit(0);
});

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Now for listening to the local client UDP messages and sending them to the server on the net.
//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// Sends a message to the server via sockets
function sendMessageToServer(message, cb) {
	//console.log("Sending Message:");
	//console.log(message);
	if (isRoomConnected) {
		netSocket.write(message, "UTF8", cb);
	} else {
		cb();
	}
}

/////////////////////////////////////////////////////////////
// Periodically clears queue to a specified host and port
(function (timeout) {
	function clearC2NQueue() {
		var buffMessage = "";
		if (c2nMessageQueue.length > 0) {
			buffMessage = c2nMessageQueue.shift();
			sendMessageToServer(buffMessage, function(err, bytes){
				c2nCounter++;
				console.log("   << send CLIENT-2-NET message: " + c2nCounter);
				clearC2NQueue();
			});
		} else {
			setTimeout(clearC2NQueue, timeout);
		}
	}
	clearC2NQueue();
}(10));

function padNumber(width, number) {
	var numString = number.toString();
	var numZeroes = width - numString.length;
	var i;
	for (i = 0; i < numZeroes; i += 1) {
		numString = "0" + numString;
	}
	return numString;
}

from_clientSocket.on("message", function (msg, rinfo) {
	var numHeader = padNumber(LENGTH_DIGITS, msg.length);
	//console.log("from_client message from " + rinfo.address + ":" + rinfo.port);
	console.log("   << push CLIENT-2-NET message: " + msg);
	// When using a chat application, an extra newline character MAY be added.
	c2nMessageQueue.push(new Buffer(numHeader + msg.toString()));
});

from_clientSocket.on("listening", function () {
	var address = from_clientSocket.address();
	console.log("listening " + address.address + ":" + address.port);
});

from_clientSocket.bind(FROM_CLIENT_PORT);