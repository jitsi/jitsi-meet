# <p align="center">Appium</p>

Helps you with automating your native or web app in Mobile Safari on iOS or Chrome on Android.
Basically, you write a normal WebDriver test, and use Appium as the Selenium server with a special set of desired capabilities.

<hr />

## Getting started

* Node.js needs to be installed - nvm, n, or brew install node
* Globally install appium - npm i -g appium@latest
* Set ANDROID_HOME=/Users/USER_NAME/Library/Android/sdk
* To check - echo ANDROID_HOME
* Set JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-18.0.2.jdk/Contents/Home
* To check - echo ANDROID_HOME
* Use Appium doctor to diagnose and fix common Node, iOS and Android configuration issues before starting Appium. - npm i -g appium-doctor@latest
* To check - appium-doctor --ios or --android
* Run tests - node TEST_FILE_PATH
* Setup WebdriverIO config file - npx wdio config
* Run tests based on the wdio.conf.js file - npx wdio CONFIG_FILE_PATH

## Writing tests

* All test files are declared in ./modules/mobile-tests/specs
* Desired capabilities, for example new devices that are available for testing,
will be added to ./modules/mobile-tests/helpers/capabilities.js.
