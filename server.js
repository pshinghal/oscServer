net = require('net');

var LISTEN_PORT = 8001;
var sockets = [];
var netMessageQueue = [];

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Periodically clears queue to a specified host and port

(function (timeout) {
    function clearNetQueue() {
	var buffMessage = "";
	var sock;
	if (netMessageQueue.length > 0) {
	    console.log("clearing messagequeue");
//	    sock = netMessageQueue.shift();
	    buffMessage = netMessageQueue.shift();
	    sendtoclients(buffMessage, sock);
	    clearNetQueue();
	} else {
	    setTimeout(clearNetQueue, timeout);
	}
    }
    clearNetQueue(timeout);
}(1000));

//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++



var s = net.Server(function(socket){
    sockets.push(socket);

    console.log("Yo ---------------------  : " + socket.toString());

    socket.on('data', function(d){
//	netMessageQueue.push(socket);
	netMessageQueue.push(d);
	console.log("received message from client" + d);
    });

    socket.on('end', function(){
	var i = sockets.indexOf(socket);
	sockets.splice(i,1);
        console.log("console: dropping client " + i);
    });
});

s.listen(LISTEN_PORT);

// sends to all sockets on list *except* sock (from whence it came)
sendtoclients = function(d, isock){

    var cleanup = []; // some sockets die without telling us about it. 
    for(var i = 0; i < sockets.length; i++){
	if (sockets[i] == isock) {
	    return;
	}
	if (sockets[i].writable){
	    sockets[i].write(d);
	} else {
	    cleanup.push(i); 
	    sockets[i].destroy();
	    console.log("will have to do clean up operation on an impolite socket");
	}
	console.log("sent to client  " + i + " the data " + d);
    }
    for(i=0;i<cleanup.length;i++){
	sockets.splice(i,1);
        console.log("console: dropping client " + i);
    }
}

var t = 0;
tfunc = function (){
    t+=5000;
    console.log("tick " + t);
    sendtoclients("time " + t, null);
}
   
//setInterval(tfunc, 5000);

