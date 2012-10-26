/*
oscServer execution:
node oscServer.js [clientHost] [from_clientPort] [to_clientPort] [remoteHost] [remotePort]
Unless clientHost, clientPort, remoteHost and remotePort are specified, the
program defaults to specified values.

This program is a "helper" application that sets up a telnet connection with a server on the net,
and passess messages between the server and a local client using UDP. The network server would 
typically be a chatroom.

The idea is to allow applications that know how to share UDP messages to do so over a WAN 
rather than just a LAN. This is not unlike Ross Bencina's OSCGroups. 
*/

var net = require('net');
var dgram = require('dgram');

var netMessageQueue = [];
var CLIENT_HOST = process.argv[2] || "192.168.2.2";
var FROM_CLIENT_PORT = process.argv[3] || 51080;
var TO_CLIENT_PORT = process.argv[4] || 51180;
var REMOTE_HOST = process.argv[5] || "animatedsoundworks.com";
var REMOTE_PORT = process.argv[6] || 8001;

var netSocket = net.connect(REMOTE_PORT, REMOTE_HOST);
var to_clientSocket = dgram.createSocket("udp4");
var from_clientSocket = dgram.createSocket("udp4");

var c2nCounter=0;
var n2cCounter=0;

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This section of the code listens for messages from the server on the net,
// and passes the to a local port as UDP messages. 
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Periodically clears queue to a specified host and port
(function (timeout, clientHost, clientPort) {
	function clearNetQueue() {
		var buffMessage = "";
		if (netMessageQueue.length > 0) {
			buffMessage = netMessageQueue.shift();
			n2cCounter++;
			to_clientSocket.send(buffMessage, 0, buffMessage.length, clientPort, clientHost, function (err, bytes) {
				console.log(".......NET-2-CLIENT clearQ message #" + n2cCounter + "  being sent to port " + clientPort);
				clearNetQueue();
			});
		} else {
			setTimeout(clearNetQueue, timeout);
		}
	}
	clearNetQueue();
}(10, CLIENT_HOST, TO_CLIENT_PORT));

// Add a connect listener
netSocket.on('connect', function () {
	console.log('HelperApp has connected to the net server!');
});

// Add a data listener
netSocket.on('data', function (data) {
	var i, charArray = [];
	netMessageQueue.push(data);
	/*
	data.forEach(function (byte) {
		charArray.push(String.fromCharCode(byte));
	});
*/
	// console.log(charArray.join(""));

	//console.log("data: " + data);
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
function sendMessageToServer(message) {
	netSocket.write(message);
}


from_clientSocket.on("message", function (msg, rinfo) {
	//console.log("from_client message from " + rinfo.address + ":" + rinfo.port);
	//console.log("   << CLIENT-2-NET message: " + msg);
	c2nCounter++;
	console.log("   << CLIENT-2-NET message: " + c2nCounter);
	sendMessageToServer("--" + msg);
});

/* no such thing as a 'data' event on dgram sockets
from_clientSocket.on("data", function (data) {
	sendMessageToServer("msg");
	console.log("from client got data: " + data);
});
*/

from_clientSocket.on("listening", function () {
	var address = from_clientSocket.address();
	console.log("listening " + address.address + ":" + address.port);
});



from_clientSocket.bind(FROM_CLIENT_PORT);