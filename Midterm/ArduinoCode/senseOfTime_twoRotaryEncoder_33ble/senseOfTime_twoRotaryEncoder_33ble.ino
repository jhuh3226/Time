#include <ArduinoBLE.h>
BLEService myService("19b10010-e8f2-537e-4f6c-d104768a1214"); // create service

// create characteristic and allow remote device to read
BLEByteCharacteristic encoderCharacteristic("19b10012-e8f2-537e-4f6c-d104768a1214", BLERead | BLENotify);
BLEByteCharacteristic buttonCharacteristic("19b10014-e8f2-537e-4f6c-d104768a1214", BLERead | BLEWrite | BLENotify);
BLEByteCharacteristic encoder2Characteristic("19b10016-e8f2-537e-4f6c-d104768a1214", BLERead | BLENotify);
BLEByteCharacteristic button2Characteristic("19b10018-e8f2-537e-4f6c-d104768a1214", BLERead | BLENotify);


/*--------rotary encoder----------*/
#include <Encoder.h>

// encoder on pins 2 and 3
// encoder on pins 5 and 5
Encoder myEncoder1(2, 3);
Encoder myEncoder2(10, 9);

int counter = 0;
bool count = false;

// pushbutton pin
const int buttonPin = 4;
const int button2Pin = 8;
int buttonState = LOW;
int lastButtonState = LOW;  // last button state
int lastButton2State = LOW;  // last button state
int debounceDelay = 5;       // debounce time for the button in ms
int settingMode = 0;        // settingMode = 0-2
int settingMode2 = 0;        // settingMode = 0-1
bool notifyButtonChange = false;
bool notifyButton2Change = false;

// previous position of the encoder:
int lastPosition  = 0;    // For encoder on right
int lastPosition2  = 0;   // For encoder on top

// steps of the encoder's shaft:
int steps = 100;    // For encoder on right
int steps2 = 100;   // For encoder on top
/*--------------------------------*/

void setup() {
  Serial.begin(9600);
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(button2Pin, INPUT_PULLUP);
  //  while (!Serial);

  // begin initialization
  if (!BLE.begin()) {
    Serial.println("starting BLE failed!");
    while (1);
  }

  BLE.setLocalName("SenseOfTime");    // set the local name peripheral advertises
  BLE.setAdvertisedService(myService);      // set the UUID for the service this peripheral advertises:
  myService.addCharacteristic(encoderCharacteristic);     // add the characteristics to the service
  myService.addCharacteristic(buttonCharacteristic);
  myService.addCharacteristic(encoder2Characteristic);
  myService.addCharacteristic(button2Characteristic);
  BLE.addService(myService);    // add the service

  encoderCharacteristic.writeValue(0);
  buttonCharacteristic.writeValue(0);
  encoder2Characteristic.writeValue(0);
  button2Characteristic.writeValue(0);

  // start advertising
  BLE.advertise();

  Serial.println("Bluetooth device active, waiting for connections...");
}

void loop() {
  // poll for BLE events
  BLE.poll();
  updateButton();
  updateButton2();
  updateEncoder();
  updateEncoder2();

  //  if (count)
  //  { countStart();
  //    settingMode = 0;
  //  }

  //  if (buttonCharacteristic.written()) {
  //    Serial.println("Written");
  //    if (buttonCharacteristic.value()) {
  //      Serial.println("Got value from web");
  //    }
  //  }
}

// ----------------------------------------------------------------------------------------------
void updateButton() {
  Serial.println(buttonState);
  /*--------pushbutton----------*/
  buttonState = digitalRead(buttonPin);
  //  // if the button has changed:
  if (buttonState != lastButtonState) {
    // debounce the button:
    delay(debounceDelay);
    // if button is pressed:
    if (buttonState == LOW) {
      // button changed
      settingMode++;
      settingMode %= 3;
      notifyButtonChange = true;
      buttonCharacteristic.writeValue(settingMode);

      //      if (settingMode == 2) {
      //        counter = 0;
      //        count = true;
      //      }

      if (settingMode == 2) settingMode = 0;  // right after settingMode2, make it to default again

      // send settngMode value as a JSON string:
      Serial.print("{\"button\":");
      Serial.print(settingMode);
      Serial.println("}");
    }
  }
  // save current button state for next time through the loop:
  lastButtonState = buttonState;
  notifyButtonChange = false;
  /*--------------------------------*/
}

void countStart() {
  //  Serial.println(counter);
  counter ++;
  if (counter > 30000) count = false;
}

// ----------------------------------------------------------------------------------------------
void updateEncoder() {
  /*--------rotary encoder----------*/
  int newPosition = myEncoder1.read();
  // compare current and last encoder state:
  int change = newPosition - lastPosition;
  // if it's changed by 4 or more (one detent step):
  if (abs(change) >= 4) {
    // get the direction (-1 or 1):
    int encoderDirection = (change / abs(change));
    steps += encoderDirection;
    Serial.print("{\"encoder\":");
    Serial.print(encoderDirection); // stepper directon
    Serial.println("}");
    // Serial.println(steps); // stepper steps
    encoderCharacteristic.writeValue(encoderDirection);
    //    buttonCharacteristic.writeValue(settingMode);

    // save knobState for next time through loop:
    lastPosition = newPosition;

    delay(1);        // delay in between reads for stability
  }
}

// ----------------------------------------------------------------------------------------------
void updateButton2() {
  int button2State = digitalRead(button2Pin);
  //  // if the button has changed:
  if (button2State != lastButton2State) {
    // debounce the button:
    delay(debounceDelay);
    // if button is pressed:
    if (button2State == LOW) {
      // button changed
      settingMode2++;
      settingMode2 %= 2;
      notifyButton2Change = true;
      button2Characteristic.writeValue(settingMode2);
      // send settngMode value as a JSON string:
      Serial.print("{\"button2\":");
      Serial.print(settingMode2);
      Serial.println("}");
    }
  }
  // save current button state for next time through the loop:
  lastButton2State = button2State;
  notifyButton2Change = false;
  /*--------------------------------*/
}

// ----------------------------------------------------------------------------------------------
void updateEncoder2() {
  /*--------rotary encoder----------*/
  int newPosition = myEncoder2.read();
  //  Serial.println(myEncoder2.read());
  // compare current and last encoder state:
  int change = newPosition - lastPosition2;
  // if it's changed by 4 or more (one detent step):
  if (abs(change) >= 4) {
    //    Serial.print("encoder2 changed");
    // get the direction (-1 or 1):
    int encoderDirection = (change / abs(change));
    steps2 += encoderDirection;
    Serial.print("{\"encoder2\":");
    Serial.print(encoderDirection); // stepper directon
    Serial.println("}");
    // Serial.println(steps2); // stepper steps
    encoder2Characteristic.writeValue(encoderDirection);
    //    buttonCharacteristic.writeValue(settingMode);

    // save knobState for next time through loop:
    lastPosition2 = newPosition;

    delay(1);        // delay in between reads for stability
  }
}
