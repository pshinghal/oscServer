/*
listenUdp execution:
node listenUdp.js [localPort]
Unless localPort is specified, the program defaults to 41234
*/

var dgram = require("dgram");
var server = dgram.createSocket("udp4");

var LOCAL_PORT = process.argv[2] || 41234;

server.on("message", function (msg, rinfo) {
	console.log("server got: " + msg + " from " + rinfo.address + ":" + rinfo.port);
});

server.on("data", function (data) {
	console.log("Received data: " + data);
});

server.on("listening", function () {
	var address = server.address();
	console.log("server listening " + address.address + ":" + address.port);
});

server.bind(LOCAL_PORT);