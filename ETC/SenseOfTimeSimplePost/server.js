var express = require('express');
var app = express();

// anything in the public directory it will run - middle ware
app.use(express.static('public'));

// do this when user puts /
app.get('/', function (req, res) {
    res.send('Hello World');
})

app.listen(80, function () {
    console.log('Example app listening on port 80!');
})