const express = require("express");
const app = express();
// const socketIO = require("socket.io");
// const fs = require("fs");
app.use(express.static("public"));

const server = app.listen(3000, () => {
	console.log("listening on port 3000!!!!!!");
});