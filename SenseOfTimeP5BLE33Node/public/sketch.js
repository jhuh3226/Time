/*------- BLE ---------*/
const serviceUuid = "19b10010-e8f2-537e-4f6c-d104768a1214";
const encoderUuid = "19b10012-e8f2-537e-4f6c-d104768a1214";
const buttonUuid = "19b10014-e8f2-537e-4f6c-d104768a1214";
const encoder2Uuid = "19b10016-e8f2-537e-4f6c-d104768a1214";
const button2Uuid = "19b10018-e8f2-537e-4f6c-d104768a1214";
let encoderCharacteristic;   // characteristic that you plan to read:
let encoder2Characteristic;
let buttonCharacteristic;   // characteristic that you plan to read:
let button2Characteristic;   // characteristic that you plan to read:
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
var inputIndivBtnState = 0;
var guessNumberTracker = -1;
/*---------------------*/

let bg;
// let audio = new Audio("url to file");
// document.getElementById("button id").onclick = audio.play;

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

// military time to AM or PM
let nonMilitaryTime = null;

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
let historyTitle = document.getElementById("historyTitle");
let history = document.getElementById("history");
// let printConsole = document.getElementById("printConsole");
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
  encoderCharacteristic = characteristics[0];    // read, notify
  buttonCharacteristic = characteristics[1];    // write, notify
  encoder2Characteristic = characteristics[2];    // read, notify
  button2Characteristic = characteristics[3];    // read, notify
  console.log(characteristics);

  for (c of characteristics) {

    if (c.uuid == encoderUuid) {
      console.log("Trying to call handleNotificationEncoder");
      var newDiv = document.createElement('div');
      newDiv.innerText = "Encoder in";
      // printConsole.appendChild(newDiv);

      // document.getElementsByName("body").appendChild("Trying to call handleNotificationEncoder")
      encoderCharacteristic = c;
      myBLE.startNotifications(encoderCharacteristic, handleNotificationEncoder);
    }

    if (c.uuid == buttonUuid) {
      console.log("Trying to call handleNotificationBtn");
      var newDiv = document.createElement('div');
      newDiv.innerText = "Btn in";
      // printConsole.appendChild(newDiv);

      // document.getElementsByName("body").appendChild("Trying to call handleNotificationBtn")
      buttonCharacteristic = c;
      myBLE.startNotifications(buttonCharacteristic, handleNotificationBtn);
    }

    if (c.uuid == encoder2Uuid) {
      console.log("Trying to call handleNotificationEncoder");
      var newDiv = document.createElement('div');
      newDiv.innerText = "Encoder2 in";
      // printConsole.appendChild(newDiv);

      // document.getElementsByName("body").appendChild("Trying to call handleNotificationEncoder")
      encoder2Characteristic = c;
      myBLE.startNotifications(encoder2Characteristic, handleNotificationEncoder2);
    }

    if (c.uuid == button2Uuid) {
      console.log("Trying to call handleNotificationBtn2");
      var newDiv = document.createElement('div');
      newDiv.innerText = " Btn2 in";
      // printConsole.appendChild(newDiv);

      // document.getElementsByName("body").appendChild("Trying to call handleNotificationBtn")
      button2Characteristic = c;
      myBLE.startNotifications(button2Characteristic, handleNotificationBtn2);
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
    writeToBleButton(1);
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

function handleNotificationEncoder2(data) {
  console.log(data);
  scrollHistory(data);
}

function handleNotificationBtn2(data) {
  inputIndivBtnState = data;
  showOrHideClock(data);

  if (data == 0) {
    console.log("Hide data");
  } else if (data == 1) {
    console.log("Show data");
  }
}

// ************************ write to BLE is somewhat not working
function writeToBleButton(sendData) {
  // console.log("writing new button status: " + sendData);
  // myBLE.write(buttonCharacteristic, sendData);
}

// Using a -90 degree rotation
function draw() {
  background(255);
  imageMode(CENTER);
  bg.resize(400, 400);
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

  AMorPM();
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

// checks AM or PM
function AMorPM() {
  // console.log(nonMilitaryTime);
  if (hr >= 12 && hr <= 23) {
    nonMilitaryTime = "PM";
  } else {
    nonMilitaryTime = "AM";
  }
}

function compareTime() {
  console.log("compare time");
  // Changing all the values so that it can calculate the time difference correctly
  // ---!!!!!!!!!!!!!!!!!!!!!!!!!!!!! -- (HAS TO SOLVE)
  // There is the problem when time becomes 0:0, it has to calculate PM and AM to solve the problem 
  if (hr == 0) {
    hr = 24;
    if (inputHr == 0) {
      inputHr = 24;
    } else if (inputHr == 1) {
      inputHr = 25;
    } else if (inputHr == 2) {
      inputHr = 26;
    } else if (inputHr == 3) {
      inputHr = 27;
    } else if (inputHr == 4) {
      inputHr = 16;
    } else if (inputHr == 5) {
      inputHr = 17;
    } else if (inputHr == 6) {
      inputHr = 18;
    } else if (inputHr == 7) {
      inputHr = 19;
    } else if (inputHr == 8) {
      inputHr = 20;
    } else if (inputHr == 9) {
      inputHr = 21;
    } else if (inputHr == 10) {
      inputHr = 22;
    } else if (inputHr == 11) {
      inputHr = 23;
    }
  }

  else if (hr == 1) {
    hr = 25;
    if (inputHr == 0) {
      inputHr = 24;
    } else if (hr == 1) {
      inputHr = 25;
    } else if (hr == 2) {
      inputHr = 26;
    } else if (hr == 3) {
      inputHr = 16;
    } else if (hr == 4) {
      inputHr = 16;
    } else if (hr == 5) {
      inputHr = 17;
    } else if (hr == 6) {
      inputHr = 18;
    } else if (hr == 7) {
      inputHr = 19;
    } else if (hr == 8) {
      inputHr = 20;
    } else if (hr == 9) {
      inputHr = 21;
    } else if (hr == 10) {
      inputHr = 22;
    } else if (hr == 11) {
      inputHr = 23;
    }
  }

  else if (hr == 2) {
    hr = 26;
    if (inputHr == 0) {
      inputHr = 24;
    } else if (hr == 1) {
      inputHr = 25;
    } else if (hr == 2) {
      inputHr = 26;
    } else if (hr == 3) {
      inputHr = 15;
    } else if (hr == 4) {
      inputHr = 16;
    } else if (hr == 5) {
      inputHr = 17;
    } else if (hr == 6) {
      inputHr = 18;
    } else if (hr == 7) {
      inputHr = 19;
    } else if (hr == 8) {
      inputHr = 20;
    } else if (hr == 9) {
      inputHr = 21;
    } else if (hr == 10) {
      inputHr = 22;
    } else if (hr == 11) {
      inputHr = 23;
    }
  }

  else if (hr == 7) {
    if (inputHr == 0) {
      inputHr = 12;
    }
  }

  else if (hr == 8) {
    if (inputHr == 0) {
      inputHr = 12;
    } else if (inputHr == 1) {
      inputHr = 13;
    }
  }

  else if (hr == 9) {
    if (inputHr == 0) {
      inputHr = 12;
    } else if (inputHr == 1) {
      inputHr = 13;
    } else if (inputHr == 2) {
      inputHr = 14;
    }
  }

  else if (hr == 10) {
    if (inputHr == 0) {
      inputHr = 12;
    } else if (inputHr == 1) {
      inputHr = 13;
    } else if (inputHr == 2) {
      inputHr = 14;
    } else if (inputHr == 3) {
      inputHr = 15;
    }
  }

  else if (hr == 11) {
    if (inputHr == 0) {
      inputHr = 12;
    } else if (inputHr == 1) {
      inputHr = 13;
    } else if (inputHr == 2) {
      inputHr = 14;
    } else if (inputHr == 3) {
      inputHr = 15;
    } else if (inputHr == 4) {
      inputHr = 16;
    }
  }

  else if (hr == 12) {
    if (inputHr == 0) {
      inputHr = 12;
    } else if (inputHr == 1) {
      inputHr = 13;
    } else if (inputHr == 2) {
      inputHr = 14;
    } else if (inputHr == 3) {
      inputHr = 15;
    } else if (inputHr == 4) {
      inputHr = 16;
    } else if (inputHr == 5) {
      inputHr = 17;
    }
  }

  else if (hr == 13) {
    if (inputHr == 0) {
      inputHr = 12;
    } else if (inputHr == 1) {
      inputHr = 13;
    } else if (inputHr == 2) {
      inputHr = 14;
    } else if (inputHr == 3) {
      inputHr = 15;
    } else if (inputHr == 4) {
      inputHr = 16;
    } else if (inputHr == 5) {
      inputHr = 17;
    } else if (inputHr == 6) {
      inputHr = 18;
    }
  }

  else if (hr == 14) {
    if (inputHr == 0) {
      inputHr = 12;
    } else if (inputHr == 1) {
      inputHr = 13;
    } else if (inputHr == 2) {
      inputHr = 14;
    } else if (inputHr == 3) {
      inputHr = 15;
    } else if (inputHr == 4) {
      inputHr = 16;
    } else if (inputHr == 5) {
      inputHr = 17;
    } else if (inputHr == 6) {
      inputHr = 18;
    } else if (inputHr == 7) {
      inputHr = 19;
    }
  }

  else if (hr == 15) {
    if (inputHr == 0) {
      inputHr = 12;
    } else if (inputHr == 1) {
      inputHr = 13;
    } else if (inputHr == 2) {
      inputHr = 14;
    } else if (inputHr == 3) {
      inputHr = 15;
    } else if (inputHr == 4) {
      inputHr = 16;
    } else if (inputHr == 5) {
      inputHr = 17;
    } else if (inputHr == 6) {
      inputHr = 18;
    } else if (inputHr == 7) {
      inputHr = 19;
    } else if (inputHr == 8) {
      inputHr = 20;
    }
  }

  else if (hr == 16) {
    if (inputHr == 0) {
      inputHr = 12;
    } else if (inputHr == 1) {
      inputHr = 13;
    } else if (inputHr == 2) {
      inputHr = 14;
    } else if (inputHr == 3) {
      inputHr = 15;
    } else if (inputHr == 4) {
      inputHr = 16;
    } else if (inputHr == 5) {
      inputHr = 17;
    } else if (inputHr == 6) {
      inputHr = 18;
    } else if (inputHr == 7) {
      inputHr = 19;
    } else if (inputHr == 8) {
      inputHr = 20;
    } else if (inputHr == 9) {
      inputHr = 21;
    }
  }

  else if (hr == 17) {
    if (inputHr == 0) {
      inputHr = 12;
    } else if (inputHr == 1) {
      inputHr = 13;
    } else if (inputHr == 2) {
      inputHr = 14;
    } else if (inputHr == 3) {
      inputHr = 15;
    } else if (inputHr == 4) {
      inputHr = 16;
    } else if (inputHr == 5) {
      inputHr = 17;
    } else if (inputHr == 6) {
      inputHr = 18;
    } else if (inputHr == 7) {
      inputHr = 19;
    } else if (inputHr == 8) {
      inputHr = 20;
    } else if (inputHr == 9) {
      inputHr = 21;
    } else if (inputHr == 10) {
      inputHr = 22;
    }
  }

  else if (hr == 18) {
    if (inputHr == 0) {
      inputHr = 12;
    } else if (inputHr == 1) {
      inputHr = 13;
    } else if (inputHr == 2) {
      inputHr = 14;
    } else if (inputHr == 3) {
      inputHr = 15;
    } else if (inputHr == 4) {
      inputHr = 16;
    } else if (inputHr == 5) {
      inputHr = 17;
    } else if (inputHr == 6) {
      inputHr = 18;
    } else if (inputHr == 7) {
      inputHr = 19;
    } else if (inputHr == 8) {
      inputHr = 20;
    } else if (inputHr == 9) {
      inputHr = 21;
    } else if (inputHr == 10) {
      inputHr = 22;
    } else if (inputHr == 11) {
      inputHr = 23;
    }
  }

  else if (hr == 19) {
    if (inputHr == 0) {
      inputHr = 24;
    } else if (inputHr == 1) {
      inputHr = 25;
    } else if (inputHr == 2) {
      inputHr = 14;
    } else if (inputHr == 3) {
      inputHr = 15;
    } else if (inputHr == 4) {
      inputHr = 16;
    } else if (inputHr == 5) {
      inputHr = 17;
    } else if (inputHr == 6) {
      inputHr = 18;
    } else if (inputHr == 7) {
      inputHr = 19;
    } else if (inputHr == 8) {
      inputHr = 20;
    } else if (inputHr == 9) {
      inputHr = 21;
    } else if (inputHr == 10) {
      inputHr = 22;
    } else if (inputHr == 11) {
      inputHr = 23;
    }
  }

  else if (hr == 20) {
    if (inputHr == 0) {
      inputHr = 24;
    } else if (inputHr == 1) {
      inputHr = 25;
    } else if (inputHr == 2) {
      inputHr = 26;
    } else if (inputHr == 3) {
      inputHr = 15;
    } else if (inputHr == 4) {
      inputHr = 16;
    } else if (inputHr == 5) {
      inputHr = 17;
    } else if (inputHr == 6) {
      inputHr = 18;
    } else if (inputHr == 7) {
      inputHr = 19;
    } else if (inputHr == 8) {
      inputHr = 20;
    } else if (inputHr == 9) {
      inputHr = 21;
    } else if (inputHr == 10) {
      inputHr = 22;
    } else if (inputHr == 11) {
      inputHr = 23;
    }
  }

  else if (hr == 21) {
    if (inputHr == 0) {
      inputHr = 24;
    } else if (inputHr == 1) {
      inputHr = 25;
    } else if (inputHr == 2) {
      inputHr = 26;
    } else if (inputHr == 3) {
      inputHr = 15;
    } else if (inputHr == 4) {
      inputHr = 16;
    } else if (inputHr == 5) {
      inputHr = 17;
    } else if (inputHr == 6) {
      inputHr = 18;
    } else if (inputHr == 7) {
      inputHr = 19;
    } else if (inputHr == 8) {
      inputHr = 20;
    } else if (inputHr == 9) {
      inputHr = 21;
    } else if (inputHr == 10) {
      inputHr = 22;
    } else if (inputHr == 11) {
      inputHr = 23;
    }
  }

  else if (hr == 22) {
    if (inputHr == 0) {
      inputHr = 24;
    } else if (inputHr == 1) {
      inputHr = 25;
    } else if (inputHr == 2) {
      inputHr = 26;
    } else if (inputHr == 3) {
      inputHr = 27;
    } else if (inputHr == 4) {
      inputHr = 16;
    } else if (inputHr == 5) {
      inputHr = 17;
    } else if (inputHr == 6) {
      inputHr = 18;
    } else if (inputHr == 7) {
      inputHr = 19;
    } else if (inputHr == 8) {
      inputHr = 20;
    } else if (inputHr == 9) {
      inputHr = 21;
    } else if (inputHr == 10) {
      inputHr = 22;
    } else if (inputHr == 11) {
      inputHr = 23;
    }
  }

  else if (hr == 23) {
    if (inputHr == 0) {
      inputHr = 24;
    } else if (inputHr == 1) {
      inputHr = 25;
    } else if (inputHr == 2) {
      inputHr = 26;
    } else if (inputHr == 3) {
      inputHr = 27;
    } else if (inputHr == 4) {
      inputHr = 16;
    } else if (inputHr == 5) {
      inputHr = 17;
    } else if (inputHr == 6) {
      inputHr = 18;
    } else if (inputHr == 7) {
      inputHr = 19;
    } else if (inputHr == 8) {
      inputHr = 20;
    } else if (inputHr == 9) {
      inputHr = 21;
    } else if (inputHr == 10) {
      inputHr = 22;
    } else if (inputHr == 11) {
      inputHr = 23;
    }
  }

  console.log(`Current time: ${hr}:${mn}, Gussed: ${inputHr}:${inputMn}`);

  compare = true;

  // if (hr >= 12) hr = hr - 12;

  console.log(`Real: ${hr}:${mn}, Guessed: ${inputHr}:${inputMn}`);

  let realTimeToMins = (hr * 60) + int(mn);
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
  line(0, 0, 70, 70);
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
  // time.innerText = `Guessed Time: ${inputHr}:${inputMn}, Button State: ${inputBtnState}`, Indiv Button State: ${inputBtnState}`;
}

function reportUser() {
  // When it is comparing time
  if (compare) {
    if (totalDifference <= 20) {
      guide.innerHTML = "You have a sense of time" + "<br />" + totalDifference + " minutes difference is totally fine";
      // report.innerHTML = "You have a sense of time";
      // console.log("totalDifference" + totalDifference);
    } else if (totalDifference > 20 && totalDifference < 270) {
      hourToTrack = Math.trunc(totalDifference / 60)
      minuteToTrack = totalDifference % 60;

      // ---!!!!!!!!!!!!!!!!!!!!!!!!!!!!! -- (HAS TO SOLVE)
      // have to devide this more. Whether user went a head, or not
      guide.innerHTML = "Think. Look back" + "<br />" + "You lost track of " + hourToTrack + " hours and " + minuteToTrack + " minutes";
      // report.innerHTML = "Think what you did";
      // console.log("totalDifference" + totalDifference);
    } else {
      guide.innerHTML = "You totally lost track of time." + "<br />" + "Is everything okay?";
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

  if (hr >= 24) hr = hr - 24;
  else if (hr < 24 && hr > 12) hr = hr - 12;

  let logHr = hr;

  feed = {
    "RealHr": logHr,
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
  // Dividing the log in three different catagory
  // <=20
  // >20 && <270
  // >=270
  if (totalDifference <= 20) newDiv.innerText = `A person guessed time at ${obj["record"][guessNumberTracker].RealHr}:${obj["record"][guessNumberTracker].RealMn} ${nonMilitaryTime} and had sense of time.`;
  else if (totalDifference > 20 && totalDifference < 270) newDiv.innerText = `A person guessed time at ${obj["record"][guessNumberTracker].RealHr}:${obj["record"][guessNumberTracker].RealMn} ${nonMilitaryTime} and lost track of ${obj["record"][guessNumberTracker].MinuteToTrack} minutes.`;
  else newDiv.innerText = `A person guessed time at ${obj["record"][guessNumberTracker].RealHr}:${obj["record"][guessNumberTracker].RealMn} ${nonMilitaryTime} and totally lost track of time.`;
  report.appendChild(newDiv);
  history.appendChild(newDiv);
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

// If indivButton is 1, hide guessing elements, show report
// If it is 0, show guessing elements, hide report
const showOrHideClock = (data) => {
  if (data == 1) {
    // Hide canvas
    guide.style.display = "none";
    canvas.style.display = "none";
    historyTitle.style.display = "block";
    history.style.display = "block";
  } else {
    guide.style.display = "block";
    canvas.style.display = "block";
    historyTitle.style.display = "none";
    history.style.display = "none";
  }
}

// document.getElementById("history").onkeyup = function (e) {
//   var code = e.keyCode;
//   if (code === 74) {
//     window.scrollTo(document.getElementById("history").scrollLeft,
//       document.getElementById("history").scrollTop + 500);
//   }
// };

const scrollHistory = (data) => {
  if (data == 255) document.getElementById("history").scrollBy(0, 10);
  else if (data == 1) document.getElementById("history").scrollBy(0, -10);
}