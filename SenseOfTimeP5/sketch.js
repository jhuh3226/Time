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

var data = []; // Data in JSON
var feed = null;
let log = document.getElementById("log");

function setup() {
  createCanvas(600, 600);

  angleMode(DEGREES);
  bg = loadImage("assets/clock3.png");
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

  guessTimeBtn = createButton("clickToGuess");
  guessTimeBtn.mousePressed(clockAwake);

  submitTimeBtn = createButton("clickToSubmit");
  submitTimeBtn.mousePressed(compareTime);
  // submitTimeBtn.mousePressed(logData);
}

// Using a -90 degree rotation

function draw() {
  background(255);
  imageMode(CENTER);
  bg.resize(300, 300);
  image(bg, 300, 300);

  // background(bg, 300,300);
  translate(300, 300);
  rotate(-90);

  // Setting the time

  hr = hour();
  mn = minute();
  let sc = second();

  // Second angel rotation
  strokeWeight(2);
  stroke(color(0));
  noFill();
  let secondAngle = map(sc, 0, 60, 0, 360);

  // Minute angel rotation
  stroke("Black");
  minuteAngle = map(mn, 0, 60, 0, 360);
  // Reference link
  // https://p5js.org/reference/#/p5/atan2
  mouseMinuteAngle = atan2(mouseY - height / 2, mouseX - width / 2) + 90;
  mapMouseMinuteAngle = map(mouseMinuteAngle, -90, 270, 0, 60) - 15;
  if (mapMouseMinuteAngle < 0) {
    mapMouseMinuteAngle = mapMouseMinuteAngle + 60;
  }

  // Hour angel rotation
  stroke("#58B95F");
  hourAngle = map(hr % 12, 0, 12, 0, 360);
  mouseHourAngle = atan2(mouseY - height / 2, mouseX - width / 2) + 90;
  mapMouseHourAngle = map(mouseHourAngle, -90, 270, 0, 12) - 3;
  if (mapMouseHourAngle < 0) {
    mapMouseHourAngle = mapMouseHourAngle + 12;
  }

  mapMouseHourAngle = int(mapMouseHourAngle);

  // Inside second line movement
  // push();
  // rotate(secondAngle);
  // stroke(0);
  // line(0, 0, 100, 0);
  // pop();

  // Inside minute line movement -------------------------------------------
  push();
  if (modifyMinuteAngle) {
    changedMinuteAngle = mouseMinuteAngle;
  }
  rotate(changedMinuteAngle);
  stroke(0, 0, 0);
  if (guessTime) line(0, 0, 90, 0);
  pop();

  // Real time
  push();
  if (compare) {
    mAdd = mAdd + 0.5;
    minuteAlpha = 125 - mAdd;
    // console.log(mAdd);
    stroke(0, 0, 0, minuteAlpha);

    if (mAdd > 124) {
      compare = !compare;
    }

    // Show how well the person did
    // && hrDifference == 0
    if (mnDifference <= 10) {
      inputText = "You have a sense of time";
      console.log("good job");
      console.log(mnDifference + hrDifference);
    } else {
      inputText = "Think what you did";
      console.log("try harder");
      console.log(mnDifference + hrDifference);
    }
  } else {
    stroke(0, 0, 0, 0);
  }
  rotate(minuteAngle);
  line(0, 0, 90, 0);
  pop();

  push();
  if (compare) {
    rotate(90);
    textSize(16);
    fill(0, minuteAlpha);
    noStroke();
    textAlign(CENTER, CENTER);
    text(inputText, 0, 200);
  }
  pop();

  // Inside hour line movement ---------------------------------------------
  push();
  if (modifyHourAngle) {
    changedHourAngle = mouseHourAngle;
  }
  rotate(changedHourAngle);
  stroke(88, 185, 95);
  if (guessTime) line(0, 0, 60, 0);
  pop();

  // Real time
  push();
  if (compare) {
    hAdd = hAdd + 0.5;
    hourAlpha = 125 - hAdd;
    // console.log(hAdd);
    stroke(88, 185, 95, hourAlpha);
  } else {
    stroke(88, 185, 95, 0);
  }
  rotate(hourAngle);
  line(0, 0, 60, 0);
  pop();

  // Center point
  stroke(0);
  ellipse(0, 0, 5, 5);

  // console.log("mn: " + mn + ", mouse mn:" + lastMn);
  // console.log("hr: " + hr + ", mouse hr:" + lastHr);

  // Clock in sleep mode, unless button is clicked
  // At mid night hr is "0"
  // console.log(hr);
  if (!guessTime) clockInSleep();
  
  console.log(guessTime);
}

function keyTyped() {
  if (key === "m") {
    console.log("m pressed");
    modifyMinuteAngle = true;
    mnKeyPressed = true;
    hrKeyPressed = false;
  } else if (key === "h") {
    console.log("h pressed");
    modifyHourAngle = true;
    hrKeyPressed = true;
    mnKeyPressed = false;
  }
}

function keyReleased() {
  if (hrKeyPressed) lastHr = mapMouseHourAngle;
  else if (mnKeyPressed) lastMn = mapMouseMinuteAngle;

  mnKeyPressed = false;
  hrKeyPressed = false;

  // console.log("hr: " + lastHr + ", mn:" + lastMn);

  modifyMinuteAngle = false;
  modifyHourAngle = false;
}

function compareTime() {
  console.log("compare time");
  // var d = dist(mouseX, mouseY, width / 2, height / 2);
  // if (d < 5) {
  //   console.log("intersect");

  compare = true;
  mAdd = 0;
  hAdd = 0;

  let realTimeToMins = lastHr * 60 + int(lastMn);
  let setTimeToMins = hr * 60 + mn;
  totalDifference = abs(realTimeToMins - setTimeToMins);

  console.log(totalDifference);

  mnDifference = abs(int(lastMn - mn));
  hrDifference = abs(int(lastHr - hr));
  
  /* Log data */
  feed = {
    RealTime: hr + ":" + mn,
    GuessedTime: lastHr + ":" + Math.floor(lastMn),
  };

  data.push(feed);
  // const myData = JSON.parse(feed);
  // const myDataGuessedTime = myData.GuessedTime;
  // log.innerText = myDataGuessedTime;
  console.log(data);
  /*-----------*/
  
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
  console.log("clock Awake");
}

function logData() {
//   feed = {
//     RealTime: hr + ":" + mn,
//     GuessedTime: lastHr + ":" + Math.floor(lastMn),
//   };

//   data.push(feed);
//   // const myData = JSON.parse(feed);
//   // const myDataGuessedTime = myData.GuessedTime;
//   // log.innerText = myDataGuessedTime;
//   console.log(data);
}
