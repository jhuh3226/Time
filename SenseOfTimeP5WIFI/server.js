// express is a node module for building HTTP servers
// import the module express
var express = require('express');
// app is the running server
var app = express();

// tell express to look in the public  directory
app.use(express.static("public"));
