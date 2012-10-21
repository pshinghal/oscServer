var net = require('net');

var sockets = [];

var s = net.Server(function (socket) {
    sockets.push(socket);
    socket.write('hello\n');
    socket.write('world\n');

    console.log("Yo ---------------------  : " + socket.toString());

    socket.on('data', function (d) {
        var i;
        for (i = 0; i < sockets.length; i += 1) {
            if (sockets[i] !== socket) {
                sockets[i].write(d);
            }
        }
        console.log("received " + d);
    });

    socket.on('end', function () {
        var i = sockets.indexOf(socket);
        sockets.splice(i, 1);
        console.log("console: dropping client " + i);
    });
});

s.listen(8001);

var t = 0;
var tfunc = function () {
    var i;
    t += 5000;
    for (i = 0; i < sockets.length; i += 1) {
        sockets[i].write("t = " + t + "\n");
    }
};

setInterval(tfunc, 5000);