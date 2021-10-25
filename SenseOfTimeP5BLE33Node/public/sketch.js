/*------- BLE ---------*/
const serviceUuid = "19b10010-e8f2-537e-4f6c-d104768a1214";
const encoderUuid = "19b10012-e8f2-537e-4f6c-d104768a1214";
const buttonUuid = "19b10014-e8f2-537e-4f6c-d104768a1214";
let encoderCharacteristic;   // characteristic that you plan to read:
let buttonCharacteristic;   // characteristic that you plan to read:
let myValue = 0;
let myBLE;    // instance of p5.ble:
let connected = false;    // bool checking connectivity
var userMnRotateVal = 0;  // minute rotation value controlled by user with rotary encoder
var rawUserMnRotateVal = 0;
var userHrRotateVal = 0;  // minute rotation value controlled by user with rotary encoder
var hrAddValue = 0;
var resetUserMn = false;  // reset min hand rotation to 0 once user starts guessing
var resetUserHr = false;

var rotating = false;
var rotatingCounter = 0;

// var used when reporting how well they guessed the time
var hourToTrack = 0;
var minuteToTrack = 0;

var inputMn = 0
var inputHr = 0;
var inputBtnState = 0;
var guessNumberTracker = -1;
/*---------------------*/

let bg;

let mn;
let changedMinuteAngle;
let mouseMinuteAngle;
let minuteAngle;
let modifyMinuteAngle;
let minuteAlpha;
let mAdd;
let mnKeyPressed;

let hr;
let changedHourAngle;
let mouseHourAngle;
let hourAngle;
let modifyHourAngle;
let hourAlpha;
let hAdd;
let hrKeyPressed;

// clock sleep mode
let sleepHrHand = 0;
let sleepMnHand = 0;

let guessTimeBtn;
let submitTimeBtn;
let guessTime = false;

let compare;

let hrDifference, mnDifference, totalDifference;

let inputText;

let lastHr, lastMn;

var jsonStr = '{"record":[]}';
var obj = null;
var feed = null;
let guide = document.getElementById("guide");
let report = document.getElementById("report");
// let log = document.getElementById("log");

function setup(event) {
  console.log('page is loaded');

  myBLE = new p5ble();      // Create a p5ble instance:
  const connectButton = document.getElementById('connectBtn');
  connectButton.addEventListener('click', connectToBle);
  connectButton.value.innerHTML = "connected";

  const saveButton = document.getElementById('saveBtn');
  saveButton.addEventListener('click', saveDataToFile);

  createCanvas(600, 600);
  angleMode(DEGREES);
  bg = loadImage("assets/clock5.png");
  modifyMinuteAngle = false;
  modifyHourAngle = false;
  compare = false;

  lastHr = null;
  lastMn = null;

  mAdd = 0;
  hAdd = 0;

  hrDifference = 0;
  mnDifference = 0;

  mnKeyPressed = false;
  hrKeyPressed = true;
}

/*------- BLE ---------*/
function connectToBle() {
  myBLE.connect(serviceUuid, readCharacteristics);     // Connect to a device by passing the service UUID
}

function gotCharacteristics(error, characteristics) {
  // console.log("got characteristics");
  if (error) {
    console.log('error', error);
    return;
  }
  // console.log(characteristics);
}

// when connected to BLE, read characteristics
function readCharacteristics(error, characteristics) {
  if (error) {
    console.log('error', error);
    return;
  }

  connected = true;   // sending bool for writing 
  encoderCharacteristic = characteristics[0];    // writing
  buttonCharacteristic = characteristics[1];    // writing
  console.log(characteristics);

  for (c of characteristics) {

    if (c.uuid == encoderUuid) {
      console.log("Trying to call handleNotificationEncoder")
      encoderCharacteristic = c;
      myBLE.startNotifications(encoderCharacteristic, handleNotificationEncoder);
    }

    if (c.uuid == buttonUuid) {
      console.log("Trying to call handleNotificationBtn")
      buttonCharacteristic = c;
      myBLE.startNotifications(buttonCharacteristic, handleNotificationBtn);
    }
  }
}
/*---------------------*/

// A function that will be called once got values
function gotValue(error, value) {
  if (error) console.log('error: ', error);
  console.log('value: ', value);
  myValue = value;
  // After getting a value, call p5ble.read() again to get the value again
  // myBLE.read(encoderCharacteristic, gotValue);
  myBLE.startNotifications(encoderCharacteristic, handleNotificationEncoder)
  // logData(data);    // value 255 is clockwise, value 1 is counterclockwise
  // You can also pass in the dataType
  // Options: 'unit8', 'uint16', 'uint32', 'int8', 'int16', 'int32', 'float32', 'float64', 'string'
}

function handleNotificationEncoder(data) {
  // console.log("handleNotificationEncoder");
  showData(data);
  drawMnHand(data);

  if (inputBtnState == 0 || inputBtnState == 2) {
    // Show this for only few seconds
    rotating = true;
    rotatingCounter = 0;
    console.log("User rotating before start guessing");
    // guide.innerHTML = "Press button to guess";
  }
}

function handleNotificationBtn(data) {
  // console.log("handleNotificationBtn");
  inputBtnState = data;
  showData(data);

  if (data == 1) {
    if (!compare) clockAwake();
    // if user pressed button when the hands are still fading away, write the inputBtnState as 2 to arduino
    // else if(compare) 
  } else if (data == 2) {
    compareTime();
  }
}

// Using a -90 degree rotation
function draw() {
  background(255);
  imageMode(CENTER);
  bg.resize(300, 300);
  image(bg, 300, 300);

  translate(300, 300);
  rotate(-90);

  // Setting the time
  hr = hour();
  mn = minute();

  // Overall hand setting
  strokeWeight(3);
  strokeCap(ROUND);
  stroke(color(0));
  noFill();

  // Reference: https://p5js.org/reference/#/p5/atan2

  // Show will time
  if (compare) {
    showRealTime();
  }

  /* Guess feedback in text */
  push();
  if (compare) {
    reportUser();
    // rotate(90);
    // textSize(16);
    // fill(0, minuteAlpha);
    // noStroke();
    // textAlign(CENTER, CENTER);
    // text(inputText, 0, 200);
  }
  pop();

  // console.log("mn: " + mn + ", mouse mn:" + lastMn);
  // console.log("hr: " + hr + ", mouse hr:" + lastHr);

  // Clock in sleep mode, unless button is clicked
  // At mid night hr is "0"
  // console.log(hr);
  if (!guessTime) clockInSleep();

  // console.log(guessTime);

  // Drawing seperate clock to test rotary encoder
  if (guessTime) {
    drawMnHand(0);
    drawHrHand(0);
  }

  // Center point
  stroke(0);
  ellipse(0, 0, 5, 5);

  reportUser();

  // console.log(`InputBtnState: ${inputBtnState}, Compare: ${compare}`);
}

function showRealTime() {
  // Minute angel rotation
  stroke("Black");
  minuteAngle = map(mn, 0, 60, 0, 360);

  // Hour angel rotation
  strokeWeight(2);
  stroke("#58B95F");
  hourAngle = map(hr % 12, 0, 12, 0, 360);
  // ---!!!!!!!!!!!!!!!!!!!!!!!!!!!!! -- (HAS TO SOLVE)
  // hourAngle = map((((hr%12)*60)), 0, 4320, 0, 360);

  /* Minute hand */
  push();
  mAdd = mAdd + 0.5;
  minuteAlpha = 125 - mAdd;
  // console.log(mAdd);
  stroke(0, 0, 0, minuteAlpha);

  rotate(minuteAngle);
  line(0, 0, 90, 0);
  pop();
  /*-----------*/

  /* Hour hand */
  push();
  hAdd = hAdd + 0.5;
  hourAlpha = 125 - hAdd;
  // console.log(hAdd);
  stroke(88, 185, 95, hourAlpha);

  rotate(hourAngle);
  line(0, 0, 60, 0);
  pop();

  // Only after few seconds, make it default
  if (mAdd > 83) {
    compare = !compare;
  }
}

function drawMnHand(data) {
  push();

  if (resetUserMn) userMnRotateVal = 0;    // Reset the rotation once it started
  resetUserMn = false;

  if (data == 255) userMnRotateVal += 6;
  else if (data == 1) userMnRotateVal -= 6;
  if (userMnRotateVal < 0) userMnRotateVal = userMnRotateVal + 360;   // if the Value goes <0, make it positive

  if (data == 255) rawUserMnRotateVal += 6;
  else if (data == 1) rawUserMnRotateVal -= 6;
  if (rawUserMnRotateVal < 0) rawUserMnRotateVal = rawUserMnRotateVal + 4320;   // if the Value goes <0, make it positive
  // console.log(rawUserMnRotateVal);

  // if (data == 255) {
  //   if (userMnRotateVal == 360) {
  //     console.log("Hour +1");
  //     drawHrHand(255);
  //   }
  // }

  // // If it was 255 before, and just became 1, ~~~~~
  // else if (data == 1) {
  //   if (userMnRotateVal == 360) {
  //     console.log("Hour -1");
  //     drawHrHand(1);
  //   }
  // }

  userMnRotateVal = userMnRotateVal % 360;  // Prevent value to go over 360
  rotate(userMnRotateVal);
  stroke(0, 0, 0);
  strokeWeight(3);
  line(0, 0, 90, 0);

  /*User input mn*/
  inputMn = userMnRotateVal / 6;
  // console.log(inputMn);
  pop();
}

function drawHrHand(boolean) {
  push();
  if (resetUserHr) rawUserMnRotateVal = 0;    // Reset the rotation once it started
  resetUserHr = false;

  inputHr = map(rawUserMnRotateVal, 0, 4320, 0, 12);   // Mapping the min to hr
  // console.log(hrAddValue);
  rotate(inputHr * 30);
  inputHr = Math.trunc(inputHr);
  stroke(88, 185, 95);
  strokeWeight(3);
  line(0, 0, 60, 0);
  pop();
}

function compareTime() {
  console.log("compare time");
  compare = true;

  if (hr >= 12) hr = hr - 12;

  console.log(`Real: ${hr}:${mn}, Guessed: ${inputHr}:${inputMn}`);

  let realTimeToMins = (hr * 60) + int(mn);
  // ---!!!!!!!!!!!!!!!!!!!!!!!!!!!!! -- (HAS TO SOLVE)
  // There is the problem when time becomes 0:0, it has to calculate PM and AM to solve the problem 
  let inputTimeToMins = (inputHr * 60) + inputMn;

  totalDifference = abs(realTimeToMins - inputTimeToMins);

  console.log(totalDifference);

  // Required to make real time fade away
  mAdd = 0;
  hAdd = 0;

  logData();

  setTimeout(makeGuessTimeFalse, 3500);   // Give feedback for 4 seconds

  /* Log data */
  // feed = {
  //   RealTime: hr + ":" + mn,
  //   GuessedTime: lastHr + ":" + Math.floor(lastMn),
  // };

  // data.push(feed);
  // // const myData = JSON.parse(feed);
  // // const myDataGuessedTime = myData.GuessedTime;
  // // log.innerText = myDataGuessedTime;
  // console.log(data);
  /*-----------*/
}

function makeGuessTimeFalse() {
  guessTime = false;
}

// Clock hand moves fast before guessing
function clockInSleep() {
  // Hour hand
  push();
  stroke("#58B95F");
  const ctxHour = canvas.getContext("2d");
  sleepHrHand = (sleepHrHand % 360) + 2;
  ctxHour.rotate((sleepHrHand * Math.PI) / 180);
  line(0, 0, 45, 45);
  pop();

  // Minute hand
  push();
  stroke("black");
  const ctxMn = canvas.getContext("2d");
  sleepMnHand = (sleepMnHand % 360) + 5;
  ctxMn.rotate((sleepMnHand * Math.PI) / 180);
  line(0, 0, 60, 60);
  pop();
}

// Go to 00:00 on button press
function clockAwake() {
  guessTime = true;
  resetUserMn = true;
  resetUserHr = true;
  console.log("clock Awake");
}

function showData(data) {
  // time.innerText = `Guessed Time: ${inputHr}:${inputMn}, Button State: ${inputBtnState}`;
}

function reportUser() {
  // When it is comparing time
  if (compare) {
    if (totalDifference <= 15) {
      guide.innerHTML = "You have a sense of time" + "<br />" + totalDifference + " minutes difference is totally fine";
      // report.innerHTML = "You have a sense of time";
      // console.log("totalDifference" + totalDifference);
    } else {
      hourToTrack = Math.trunc(totalDifference / 60)
      minuteToTrack = totalDifference % 60;

      // ---!!!!!!!!!!!!!!!!!!!!!!!!!!!!! -- (HAS TO SOLVE)
      // have to devide this more. Whether user went a head, or not
      guide.innerHTML = "Think. Look back" + "<br />" + "You lost track of " + hourToTrack + " hours and " + minuteToTrack + " minutes";
      // report.innerHTML = "Think what you did";
      // console.log("totalDifference" + totalDifference);
    }
  }
  // When it is not comparing time
  else {
    if (inputBtnState == 2 || inputBtnState == 0) {
      if (!rotating) guide.innerHTML = "What's the time?" + "<br />" + "Make a guess"
      else {
        guide.innerHTML = "Press button to guess";
        rotatingCounter += 1;
        if (rotatingCounter > 50) {
          rotating = false;
        }
      }
    } else if (inputBtnState == 1) {
      guide.innerHTML = "Tic track, tic track"
    }
  }
}

function logData() {
  guessNumberTracker += 1;
  feed = {
    "RealHr": hr,
    "RealMn": mn,
    "GuessedHr": inputHr,
    "GuessedMn": inputMn,
    "MinuteToTrack": totalDifference
  };

  obj = JSON.parse(jsonStr);
  obj['record'].push(feed);
  jsonStr = JSON.stringify(obj);
  console.log(jsonStr);
  console.log(obj["record"][0].GuessedHr);

  console.log("JSON array length: " + obj["record"].length);

  // for (let i = 0; i < obj["record"].length; i++) {
  //   // var newDiv = document.createElement('div');
  //   report.innerText = `A person guessed time at ${obj["record"][i].RealHr}:${obj["record"][i].RealMn} and lost track of ${obj["record"][i].MinuteToTrack} minutes`;
  //   // report.append(`A person guessed time at ${obj["record"][i].RealHr}:${obj["record"][i].RealMn} and lost track of ${obj["record"][i].MinuteToTrack} minutes`);
  //   // report.innetText = newDiv;
  //   // report.append(`A person guessed time at ${obj["record"][i].RealHr}:${obj["record"][i].RealMn} and lost track of ${obj["record"][i].MinuteToTrack} minutes`);
  //   // report.append(newDiv);
  // }
  // report.append(`A person guessed time at ${obj["record"][guessNumberTracker].RealHr}:${obj["record"][guessNumberTracker].RealMn} and lost track of ${obj["record"][guessNumberTracker].MinuteToTrack} minutes`);


  var newDiv = document.createElement('div');
  newDiv.innerText = `A person guessed time at ${obj["record"][guessNumberTracker].RealHr}:${obj["record"][guessNumberTracker].RealMn} and lost track of ${obj["record"][guessNumberTracker].MinuteToTrack} minutes`;
  report.appendChild(newDiv);
}

function saveDataToFile() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 2)], {
    type: "text/plain"
  }));
  a.setAttribute("download", "data.txt");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}