// server.js

'use strict';

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var Writable = require('stream').Writable;
var BrowserStream = new Writable();
// create server
server.listen(7777);
BrowserStream._write = function(chunk, enc, next) {
    var string = chunk.toString('utf8');
    io.sockets.emit('news', string);
    next();
};
// pipe stdin to bs
process.stdin.pipe(BrowserStream);
// pipe stdin to term
// process.stdin.pipe(process.stdout);
console.log('server running');
