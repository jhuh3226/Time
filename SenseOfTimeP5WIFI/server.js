// express is a node module for building HTTP servers
// import the module express
var express = require('express');
// app is the running server
const server = express();
// include body-parser so we can read the body of a HTTP request:
const bodyParser = require("body-parser");
// set up an array of known users' unique IDs (uids):
let knownClients = ["01237139E45EC4AAEE","3c71bf87c2b0"]

// serve static files from /public:
server.use("/", express.static("public"));
//  body parser for  application/json from the POST request:
server.use(bodyParser.json());

// an array to hold records send by clients:
let records = new Array();

// this runs after the server successfully starts:
function serverStart() {
  var port = this.address().port;
  console.log("Server listening on port " + port);
}

// handler for GET /:uid/records/:startDate/:endDate
function getData(request, response) {
  // check to see if they sent a known UID:
  let uid = request.params.uid;
  // if the UID is not known, send a 403 forbidden response:
  if (!knownClients.includes(uid)) {
    response.status(403).send("you are not a known client");
    // quit this function:
    return;
  }
  // get the dateTime from their request:
  let startDate = new Date(request.params.startTime);
  let endDate = new Date(request.params.endTime);
  let recordsToSend = new Array();
  // send all records from startDate to endDate: 
  // get the existing records. This is where we'd make a call
  // to a database if we were using one:
  console.log(records.length);
  for (var thisRecord of records) {
    // get each line's date
    let recordDate = new Date(thisRecord.timeStamp);
    console.log(thisRecord);
    // if the date is later than startDate,
    // add it to the response string
    if (recordDate >= startDate &&
      recordDate <= endDate) {
      recordsToSend.push(thisRecord);
    }
  }
  console.log(recordsToSend);
  response.send(recordsToSend);
}

// handler for  POST /data
function postData(request, response) {
  console.log("Got a POST request");

  let record = request.body;
  if (knownClients.includes(record.uid)) {
    // this is where we might consider putting the record into
    // a database instead of just putting it in an array:
    records.push(record);
    console.log(records);
    // send the response in JSON format (to be consistent):
    response.json({ record: "received" });
  } else {
    // if the client is not a known client, reject them:
    response.status(403)
      .json({ record: "rejected" });
  }
  response.end();
}

// start the server:
server.listen(process.env.PORT || 80, serverStart);
// API endpoint listeners:
server.get("/:uid/records/:startTime/:endTime/", getData);
server.post("/data", postData);

// const server = app.listen(80, () => {
// 	console.log("listening on port 80");
// });