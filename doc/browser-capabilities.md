# Jitsi Meet browser capabilities

An API for checking browser capabilities for Jitsi Meet.

## Installation

To use the Jitsi Meet browser capabilities API in your application you need to add a JS file with `BrowserCapabilities` implementation:

```javascript
<script src="https://meet.jit.si/libs/browser_capabilities.min.js"></script>
```

## API

### Constructor

* **isUsingIFrame**: `true` if Jitsi Meet is loaded in iframe and `false` otherwise. The default value is `false`.
* **browserInfo**: Information about the browser which capabilities will be checked. If not specified `BrowserCapabilities` class will detect the current browser. `browserInfo` is JS object with the following properties:
    * **name**: The name of the browser compatible with the names returned by [bowser](https://github.com/lancedikson/bowser#all-detected-browsers)
    * **version**: The version of the browser compatible with the version returned by [bowser](https://github.com/lancedikson/bowser#all-detected-browsers)

**Example:**
```javascript
const browserCapabilities = new BrowserCapabilities(); // not using iframe;  capabilities for the current browser
const browserCapabilities1 = new BrowserCapabilities(true); // using iframe; capabilities for the current browser.
const browserCapabilities1 = new BrowserCapabilities(true, {
    name: 'Chrome',
    version: '63.0'
}); // using iframe; capabilities for Chrome 63.0
```

### Methods:

* **isSupported** - returns `true` if the browser is supported by Jitsi Meet and `false` otherwise.

* **supportsAudioIn** - returns `true` if the browser supports incoming audio and `false` otherwise.

* **supportsAudioOut** - returns `true` if the browser supports outgoing audio and `false` otherwise.

* **supportsVideo** - returns `true` if the browser is supports video and `false` otherwise.

* **supportsScreenSharing** - returns `true` if the browser is supports screen sharing and `false` otherwise.
