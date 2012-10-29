/*
sendUdp execution:
node sendUdp.js [host] [port] [message] [number]
Sends 'message' to 'host':'port', 'number' times
*/

var HOST = process.argv[2] || "localhost";
var PORT = parseInt(process.argv[3], 10) || 41234;
var MESSAGE = process.argv[4] || "HelloWorld";
var NUMBER = parseInt(process.argv[5], 10) || 1;

var dgram = require("dgram");
var messsageBuffer = new Buffer(MESSAGE);
var socket = dgram.createSocket("udp4");

function sendMessages(number) {
	if (number <= 0)
		return;
	socket.send(messsageBuffer, 0, messsageBuffer.length, PORT, HOST, function (err, bytes) {
		console.log(err);
		console.log(bytes);
		sendMessages(number - 1);
	});
}

sendMessages(NUMBER);