# <p align="center">Appium</p>

Helps you with automating your native or web app in Mobile Safari on iOS or Chrome on Android.
Basically, you write a normal WebDriver test, and use Appium as the Selenium server with a special set of desired capabilities.

<hr />

## Getting started

* Node.js needs to be installed - nvm, n, or brew install node
* Globally install appium - npm i -g appium@latest
  * 1.22.3 is the latest right now, but still check if that is correct.
* Set ANDROID_HOME=/Users/USER_NAME/Library/Android/sdk
* To check - echo ANDROID_HOME
* Set JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-18.0.2.jdk/Contents/Home
* To check - echo ANDROID_HOME
* Use Appium doctor to diagnose and fix common Node, iOS and Android configuration issues before starting Appium. - npm i -g appium-doctor@latest
* To check - appium-doctor --ios or --android
* Go to - https://github.com/appium/appium-desktop - download and install Appium Desktop.
* For selectors and setting up different device capabilities, install Appium Inspector - https://github.com/appium/appium-inspector
* Setup WebdriverIO config file - npm init wdio.
* Don't forget to add appium as a service.

## Writing tests

* All test files are declared in ./modules/mobile-tests/specs
* Desired capabilities, for example new devices that are available for testing,
will be added to ./modules/mobile-tests/helpers/capabilities.js.
* For iOS, you need to open Jitsi project in Xcode -> open Product menu -> press Archive.
  * The path for the archived project file will be placed in the capabilities file, more exactly as a - 'appium:app' - value.
* In order to find YOUR_TESTING_DEVICE_ID you need to:
  * iOS
    * Go to Settings > General and tap About.
    * Look for the serial number. You might need to scroll down to find the IMEI/MEID.
    * Copy the IMEI/MEID
  * Android
    * First you need to install ADB by following this:
      * https://www.howtogeek.com/125769/how-to-install-and-use-abd-the-android-debug-bridge-utility/
    * Open terminal and run 'adb devices'.
    * If your physical testing device is plugged in your USB, the previous command will return its ID.

## Build Archive for iOS

* Before running tests, you need to generate a release archive.
* Inside ios/scripts you will find release-archive.sh.
* Run that script and it will export an JitsiMeet.xcarchive that will contain an .app file.
* The path to that .app file will be added to 'app' property inside capabilities file.

## Running tests

* First npm i and make sure that the port is not occupied - sudo launchctl remove com.mcafee.agent.macmn
* Open Appium Desktop and press Edit Configurations.
* Add the two variables, ANDROID_HOME and JAVA_HOME and press Save and Restart.
* Go back to Appium Desktop and press startServer.
  * A terminal will appear that will say - The server is running.
  * Press the magnifying glass aka inspector icon and that will open Appium Inspector.
      * Add your desired device capabilities.
      * Set Remote Host - localhost.
      * Set Remote Path - /wd/hub/.
      * Be sure that your testing device is connected to your PC or Laptop.
      * Press Start Session.
* Run tests - node TEST_FILE_PATH
* Run tests based on the wdio.conf.js file - wdio run WDIO_CONFIG_FILE_PATH --watch
