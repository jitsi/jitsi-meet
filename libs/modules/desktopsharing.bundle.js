!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.desktopsharing=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global $, alert, changeLocalVideo, chrome, config, getConferenceHandler, getUserMediaWithConstraints */
/**
 * Indicates that desktop stream is currently in use(for toggle purpose).
 * @type {boolean}
 */
var isUsingScreenStream = false;
/**
 * Indicates that switch stream operation is in progress and prevent from triggering new events.
 * @type {boolean}
 */
var switchInProgress = false;

/**
 * Method used to get screen sharing stream.
 *
 * @type {function (stream_callback, failure_callback}
 */
var obtainDesktopStream = null;

/**
 * Flag used to cache desktop sharing enabled state. Do not use directly as it can be <tt>null</tt>.
 * @type {null|boolean}
 */
var _desktopSharingEnabled = null;

var EventEmitter = require("events");

var eventEmitter = new EventEmitter();

/**
 * Method obtains desktop stream from WebRTC 'screen' source.
 * Flag 'chrome://flags/#enable-usermedia-screen-capture' must be enabled.
 */
function obtainWebRTCScreen(streamCallback, failCallback) {
    RTC.getUserMediaWithConstraints(
        ['screen'],
        streamCallback,
        failCallback
    );
}

/**
 * Constructs inline install URL for Chrome desktop streaming extension.
 * The 'chromeExtensionId' must be defined in config.js.
 * @returns {string}
 */
function getWebStoreInstallUrl()
{
    return "https://chrome.google.com/webstore/detail/" + config.chromeExtensionId;
}

/**
 * Checks whether extension update is required.
 * @param minVersion minimal required version
 * @param extVersion current extension version
 * @returns {boolean}
 */
function isUpdateRequired(minVersion, extVersion)
{
    try
    {
        var s1 = minVersion.split('.');
        var s2 = extVersion.split('.');

        var len = Math.max(s1.length, s2.length);
        for (var i = 0; i < len; i++)
        {
            var n1 = 0,
                n2 = 0;

            if (i < s1.length)
                n1 = parseInt(s1[i]);
            if (i < s2.length)
                n2 = parseInt(s2[i]);

            if (isNaN(n1) || isNaN(n2))
            {
                return true;
            }
            else if (n1 !== n2)
            {
                return n1 > n2;
            }
        }

        // will happen if boths version has identical numbers in
        // their components (even if one of them is longer, has more components)
        return false;
    }
    catch (e)
    {
        console.error("Failed to parse extension version", e);
        UI.messageHandler.showError('Error',
            'Error when trying to detect desktopsharing extension.');
        return true;
    }
}


function checkExtInstalled(isInstalledCallback) {
    if (!chrome.runtime) {
        // No API, so no extension for sure
        isInstalledCallback(false);
        return;
    }
    chrome.runtime.sendMessage(
        config.chromeExtensionId,
        { getVersion: true },
        function (response) {
            if (!response || !response.version) {
                // Communication failure - assume that no endpoint exists
                console.warn("Extension not installed?: " + chrome.runtime.lastError);
                isInstalledCallback(false);
            } else {
                // Check installed extension version
                var extVersion = response.version;
                console.log('Extension version is: ' + extVersion);
                var updateRequired = isUpdateRequired(config.minChromeExtVersion, extVersion);
                if (updateRequired) {
                    alert(
                        'Jitsi Desktop Streamer requires update. ' +
                        'Changes will take effect after next Chrome restart.');
                }
                isInstalledCallback(!updateRequired);
            }
        }
    );
}

function doGetStreamFromExtension(streamCallback, failCallback) {
    // Sends 'getStream' msg to the extension. Extension id must be defined in the config.
    chrome.runtime.sendMessage(
        config.chromeExtensionId,
        { getStream: true, sources: config.desktopSharingSources },
        function (response) {
            if (!response) {
                failCallback(chrome.runtime.lastError);
                return;
            }
            console.log("Response from extension: " + response);
            if (response.streamId) {
                RTC.getUserMediaWithConstraints(
                    ['desktop'],
                    function (stream) {
                        streamCallback(stream);
                    },
                    failCallback,
                    null, null, null,
                    response.streamId);
            } else {
                failCallback("Extension failed to get the stream");
            }
        }
    );
}
/**
 * Asks Chrome extension to call chooseDesktopMedia and gets chrome 'desktop' stream for returned stream token.
 */
function obtainScreenFromExtension(streamCallback, failCallback) {
    checkExtInstalled(
        function (isInstalled) {
            if (isInstalled) {
                doGetStreamFromExtension(streamCallback, failCallback);
            } else {
                chrome.webstore.install(
                    getWebStoreInstallUrl(),
                    function (arg) {
                        console.log("Extension installed successfully", arg);
                        // We need to reload the page in order to get the access to chrome.runtime
                        window.location.reload(false);
                    },
                    function (arg) {
                        console.log("Failed to install the extension", arg);
                        failCallback(arg);
                        UI.messageHandler.showError('Error',
                            'Failed to install desktop sharing extension');
                    }
                );
            }
        }
    );
}

/**
 * Call this method to toggle desktop sharing feature.
 * @param method pass "ext" to use chrome extension for desktop capture(chrome extension required),
 *        pass "webrtc" to use WebRTC "screen" desktop source('chrome://flags/#enable-usermedia-screen-capture'
 *        must be enabled), pass any other string or nothing in order to disable this feature completely.
 */
function setDesktopSharing(method) {
    // Check if we are running chrome
    if (!navigator.webkitGetUserMedia) {
        obtainDesktopStream = null;
        console.info("Desktop sharing disabled");
    } else if (method == "ext") {
        obtainDesktopStream = obtainScreenFromExtension;
        console.info("Using Chrome extension for desktop sharing");
    } else if (method == "webrtc") {
        obtainDesktopStream = obtainWebRTCScreen;
        console.info("Using Chrome WebRTC for desktop sharing");
    }

    // Reset enabled cache
    _desktopSharingEnabled = null;
}

/**
 * Initializes <link rel=chrome-webstore-item /> with extension id set in config.js to support inline installs.
 * Host site must be selected as main website of published extension.
 */
function initInlineInstalls()
{
    $("link[rel=chrome-webstore-item]").attr("href", getWebStoreInstallUrl());
}

function getSwitchStreamFailed(error) {
    console.error("Failed to obtain the stream to switch to", error);
    switchInProgress = false;
}

function streamSwitchDone() {
    switchInProgress = false;
    eventEmitter.emit(
        DesktopSharingEventTypes.SWITCHING_DONE,
        isUsingScreenStream);
}

function newStreamCreated(stream)
{
    eventEmitter.emit(DesktopSharingEventTypes.NEW_STREAM_CREATED,
        stream, isUsingScreenStream, streamSwitchDone);
}


module.exports = {
    isUsingScreenStream: function () {
        return isUsingScreenStream;
    },

    /**
     * @returns {boolean} <tt>true</tt> if desktop sharing feature is available and enabled.
     */
    isDesktopSharingEnabled: function () {
        if (_desktopSharingEnabled === null) {
            if (obtainDesktopStream === obtainScreenFromExtension) {
                // Parse chrome version
                var userAgent = navigator.userAgent.toLowerCase();
                // We can assume that user agent is chrome, because it's enforced when 'ext' streaming method is set
                var ver = parseInt(userAgent.match(/chrome\/(\d+)\./)[1], 10);
                console.log("Chrome version" + userAgent, ver);
                _desktopSharingEnabled = ver >= 34;
            } else {
                _desktopSharingEnabled = obtainDesktopStream === obtainWebRTCScreen;
            }
        }
        return _desktopSharingEnabled;
    },
    
    init: function () {
        setDesktopSharing(config.desktopSharing);

        // Initialize Chrome extension inline installs
        if (config.chromeExtensionId) {
            initInlineInstalls();
        }

        eventEmitter.emit(DesktopSharingEventTypes.INIT);
    },

    addListener: function(listener, type)
    {
        eventEmitter.on(type, listener);
    },

    removeListener: function (listener,type) {
        eventEmitter.removeListener(type, listener);
    },

    /*
     * Toggles screen sharing.
     */
    toggleScreenSharing: function () {
        if (switchInProgress || !obtainDesktopStream) {
            console.warn("Switch in progress or no method defined");
            return;
        }
        switchInProgress = true;

        if (!isUsingScreenStream)
        {
            // Switch to desktop stream
            obtainDesktopStream(
                function (stream) {
                    // We now use screen stream
                    isUsingScreenStream = true;
                    // Hook 'ended' event to restore camera when screen stream stops
                    stream.addEventListener('ended',
                        function (e) {
                            if (!switchInProgress && isUsingScreenStream) {
                                toggleScreenSharing();
                            }
                        }
                    );
                    newStreamCreated(stream);
                },
                getSwitchStreamFailed);
        } else {
            // Disable screen stream
            RTC.getUserMediaWithConstraints(
                ['video'],
                function (stream) {
                    // We are now using camera stream
                    isUsingScreenStream = false;
                    newStreamCreated(stream);
                },
                getSwitchStreamFailed, config.resolution || '360'
            );
        }
    }
};


},{"events":2}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL2Rlc2t0b3BzaGFyaW5nL2Rlc2t0b3BzaGFyaW5nLmpzIiwiL3Vzci9sb2NhbC9saWIvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyogZ2xvYmFsICQsIGFsZXJ0LCBjaGFuZ2VMb2NhbFZpZGVvLCBjaHJvbWUsIGNvbmZpZywgZ2V0Q29uZmVyZW5jZUhhbmRsZXIsIGdldFVzZXJNZWRpYVdpdGhDb25zdHJhaW50cyAqL1xuLyoqXG4gKiBJbmRpY2F0ZXMgdGhhdCBkZXNrdG9wIHN0cmVhbSBpcyBjdXJyZW50bHkgaW4gdXNlKGZvciB0b2dnbGUgcHVycG9zZSkuXG4gKiBAdHlwZSB7Ym9vbGVhbn1cbiAqL1xudmFyIGlzVXNpbmdTY3JlZW5TdHJlYW0gPSBmYWxzZTtcbi8qKlxuICogSW5kaWNhdGVzIHRoYXQgc3dpdGNoIHN0cmVhbSBvcGVyYXRpb24gaXMgaW4gcHJvZ3Jlc3MgYW5kIHByZXZlbnQgZnJvbSB0cmlnZ2VyaW5nIG5ldyBldmVudHMuXG4gKiBAdHlwZSB7Ym9vbGVhbn1cbiAqL1xudmFyIHN3aXRjaEluUHJvZ3Jlc3MgPSBmYWxzZTtcblxuLyoqXG4gKiBNZXRob2QgdXNlZCB0byBnZXQgc2NyZWVuIHNoYXJpbmcgc3RyZWFtLlxuICpcbiAqIEB0eXBlIHtmdW5jdGlvbiAoc3RyZWFtX2NhbGxiYWNrLCBmYWlsdXJlX2NhbGxiYWNrfVxuICovXG52YXIgb2J0YWluRGVza3RvcFN0cmVhbSA9IG51bGw7XG5cbi8qKlxuICogRmxhZyB1c2VkIHRvIGNhY2hlIGRlc2t0b3Agc2hhcmluZyBlbmFibGVkIHN0YXRlLiBEbyBub3QgdXNlIGRpcmVjdGx5IGFzIGl0IGNhbiBiZSA8dHQ+bnVsbDwvdHQ+LlxuICogQHR5cGUge251bGx8Ym9vbGVhbn1cbiAqL1xudmFyIF9kZXNrdG9wU2hhcmluZ0VuYWJsZWQgPSBudWxsO1xuXG52YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZShcImV2ZW50c1wiKTtcblxudmFyIGV2ZW50RW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxuLyoqXG4gKiBNZXRob2Qgb2J0YWlucyBkZXNrdG9wIHN0cmVhbSBmcm9tIFdlYlJUQyAnc2NyZWVuJyBzb3VyY2UuXG4gKiBGbGFnICdjaHJvbWU6Ly9mbGFncy8jZW5hYmxlLXVzZXJtZWRpYS1zY3JlZW4tY2FwdHVyZScgbXVzdCBiZSBlbmFibGVkLlxuICovXG5mdW5jdGlvbiBvYnRhaW5XZWJSVENTY3JlZW4oc3RyZWFtQ2FsbGJhY2ssIGZhaWxDYWxsYmFjaykge1xuICAgIFJUQy5nZXRVc2VyTWVkaWFXaXRoQ29uc3RyYWludHMoXG4gICAgICAgIFsnc2NyZWVuJ10sXG4gICAgICAgIHN0cmVhbUNhbGxiYWNrLFxuICAgICAgICBmYWlsQ2FsbGJhY2tcbiAgICApO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgaW5saW5lIGluc3RhbGwgVVJMIGZvciBDaHJvbWUgZGVza3RvcCBzdHJlYW1pbmcgZXh0ZW5zaW9uLlxuICogVGhlICdjaHJvbWVFeHRlbnNpb25JZCcgbXVzdCBiZSBkZWZpbmVkIGluIGNvbmZpZy5qcy5cbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGdldFdlYlN0b3JlSW5zdGFsbFVybCgpXG57XG4gICAgcmV0dXJuIFwiaHR0cHM6Ly9jaHJvbWUuZ29vZ2xlLmNvbS93ZWJzdG9yZS9kZXRhaWwvXCIgKyBjb25maWcuY2hyb21lRXh0ZW5zaW9uSWQ7XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgZXh0ZW5zaW9uIHVwZGF0ZSBpcyByZXF1aXJlZC5cbiAqIEBwYXJhbSBtaW5WZXJzaW9uIG1pbmltYWwgcmVxdWlyZWQgdmVyc2lvblxuICogQHBhcmFtIGV4dFZlcnNpb24gY3VycmVudCBleHRlbnNpb24gdmVyc2lvblxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGlzVXBkYXRlUmVxdWlyZWQobWluVmVyc2lvbiwgZXh0VmVyc2lvbilcbntcbiAgICB0cnlcbiAgICB7XG4gICAgICAgIHZhciBzMSA9IG1pblZlcnNpb24uc3BsaXQoJy4nKTtcbiAgICAgICAgdmFyIHMyID0gZXh0VmVyc2lvbi5zcGxpdCgnLicpO1xuXG4gICAgICAgIHZhciBsZW4gPSBNYXRoLm1heChzMS5sZW5ndGgsIHMyLmxlbmd0aCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICAgIHtcbiAgICAgICAgICAgIHZhciBuMSA9IDAsXG4gICAgICAgICAgICAgICAgbjIgPSAwO1xuXG4gICAgICAgICAgICBpZiAoaSA8IHMxLmxlbmd0aClcbiAgICAgICAgICAgICAgICBuMSA9IHBhcnNlSW50KHMxW2ldKTtcbiAgICAgICAgICAgIGlmIChpIDwgczIubGVuZ3RoKVxuICAgICAgICAgICAgICAgIG4yID0gcGFyc2VJbnQoczJbaV0pO1xuXG4gICAgICAgICAgICBpZiAoaXNOYU4objEpIHx8IGlzTmFOKG4yKSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKG4xICE9PSBuMilcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbjEgPiBuMjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHdpbGwgaGFwcGVuIGlmIGJvdGhzIHZlcnNpb24gaGFzIGlkZW50aWNhbCBudW1iZXJzIGluXG4gICAgICAgIC8vIHRoZWlyIGNvbXBvbmVudHMgKGV2ZW4gaWYgb25lIG9mIHRoZW0gaXMgbG9uZ2VyLCBoYXMgbW9yZSBjb21wb25lbnRzKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNhdGNoIChlKVxuICAgIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkZhaWxlZCB0byBwYXJzZSBleHRlbnNpb24gdmVyc2lvblwiLCBlKTtcbiAgICAgICAgVUkubWVzc2FnZUhhbmRsZXIuc2hvd0Vycm9yKCdFcnJvcicsXG4gICAgICAgICAgICAnRXJyb3Igd2hlbiB0cnlpbmcgdG8gZGV0ZWN0IGRlc2t0b3BzaGFyaW5nIGV4dGVuc2lvbi4nKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuXG5cbmZ1bmN0aW9uIGNoZWNrRXh0SW5zdGFsbGVkKGlzSW5zdGFsbGVkQ2FsbGJhY2spIHtcbiAgICBpZiAoIWNocm9tZS5ydW50aW1lKSB7XG4gICAgICAgIC8vIE5vIEFQSSwgc28gbm8gZXh0ZW5zaW9uIGZvciBzdXJlXG4gICAgICAgIGlzSW5zdGFsbGVkQ2FsbGJhY2soZmFsc2UpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKFxuICAgICAgICBjb25maWcuY2hyb21lRXh0ZW5zaW9uSWQsXG4gICAgICAgIHsgZ2V0VmVyc2lvbjogdHJ1ZSB9LFxuICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2UgfHwgIXJlc3BvbnNlLnZlcnNpb24pIHtcbiAgICAgICAgICAgICAgICAvLyBDb21tdW5pY2F0aW9uIGZhaWx1cmUgLSBhc3N1bWUgdGhhdCBubyBlbmRwb2ludCBleGlzdHNcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oXCJFeHRlbnNpb24gbm90IGluc3RhbGxlZD86IFwiICsgY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcbiAgICAgICAgICAgICAgICBpc0luc3RhbGxlZENhbGxiYWNrKGZhbHNlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaW5zdGFsbGVkIGV4dGVuc2lvbiB2ZXJzaW9uXG4gICAgICAgICAgICAgICAgdmFyIGV4dFZlcnNpb24gPSByZXNwb25zZS52ZXJzaW9uO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFeHRlbnNpb24gdmVyc2lvbiBpczogJyArIGV4dFZlcnNpb24pO1xuICAgICAgICAgICAgICAgIHZhciB1cGRhdGVSZXF1aXJlZCA9IGlzVXBkYXRlUmVxdWlyZWQoY29uZmlnLm1pbkNocm9tZUV4dFZlcnNpb24sIGV4dFZlcnNpb24pO1xuICAgICAgICAgICAgICAgIGlmICh1cGRhdGVSZXF1aXJlZCkge1xuICAgICAgICAgICAgICAgICAgICBhbGVydChcbiAgICAgICAgICAgICAgICAgICAgICAgICdKaXRzaSBEZXNrdG9wIFN0cmVhbWVyIHJlcXVpcmVzIHVwZGF0ZS4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnQ2hhbmdlcyB3aWxsIHRha2UgZWZmZWN0IGFmdGVyIG5leHQgQ2hyb21lIHJlc3RhcnQuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlzSW5zdGFsbGVkQ2FsbGJhY2soIXVwZGF0ZVJlcXVpcmVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG59XG5cbmZ1bmN0aW9uIGRvR2V0U3RyZWFtRnJvbUV4dGVuc2lvbihzdHJlYW1DYWxsYmFjaywgZmFpbENhbGxiYWNrKSB7XG4gICAgLy8gU2VuZHMgJ2dldFN0cmVhbScgbXNnIHRvIHRoZSBleHRlbnNpb24uIEV4dGVuc2lvbiBpZCBtdXN0IGJlIGRlZmluZWQgaW4gdGhlIGNvbmZpZy5cbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZShcbiAgICAgICAgY29uZmlnLmNocm9tZUV4dGVuc2lvbklkLFxuICAgICAgICB7IGdldFN0cmVhbTogdHJ1ZSwgc291cmNlczogY29uZmlnLmRlc2t0b3BTaGFyaW5nU291cmNlcyB9LFxuICAgICAgICBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBmYWlsQ2FsbGJhY2soY2hyb21lLnJ1bnRpbWUubGFzdEVycm9yKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlJlc3BvbnNlIGZyb20gZXh0ZW5zaW9uOiBcIiArIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdHJlYW1JZCkge1xuICAgICAgICAgICAgICAgIFJUQy5nZXRVc2VyTWVkaWFXaXRoQ29uc3RyYWludHMoXG4gICAgICAgICAgICAgICAgICAgIFsnZGVza3RvcCddLFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJlYW1DYWxsYmFjayhzdHJlYW0pO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBmYWlsQ2FsbGJhY2ssXG4gICAgICAgICAgICAgICAgICAgIG51bGwsIG51bGwsIG51bGwsXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlLnN0cmVhbUlkKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmFpbENhbGxiYWNrKFwiRXh0ZW5zaW9uIGZhaWxlZCB0byBnZXQgdGhlIHN0cmVhbVwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG59XG4vKipcbiAqIEFza3MgQ2hyb21lIGV4dGVuc2lvbiB0byBjYWxsIGNob29zZURlc2t0b3BNZWRpYSBhbmQgZ2V0cyBjaHJvbWUgJ2Rlc2t0b3AnIHN0cmVhbSBmb3IgcmV0dXJuZWQgc3RyZWFtIHRva2VuLlxuICovXG5mdW5jdGlvbiBvYnRhaW5TY3JlZW5Gcm9tRXh0ZW5zaW9uKHN0cmVhbUNhbGxiYWNrLCBmYWlsQ2FsbGJhY2spIHtcbiAgICBjaGVja0V4dEluc3RhbGxlZChcbiAgICAgICAgZnVuY3Rpb24gKGlzSW5zdGFsbGVkKSB7XG4gICAgICAgICAgICBpZiAoaXNJbnN0YWxsZWQpIHtcbiAgICAgICAgICAgICAgICBkb0dldFN0cmVhbUZyb21FeHRlbnNpb24oc3RyZWFtQ2FsbGJhY2ssIGZhaWxDYWxsYmFjayk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNocm9tZS53ZWJzdG9yZS5pbnN0YWxsKFxuICAgICAgICAgICAgICAgICAgICBnZXRXZWJTdG9yZUluc3RhbGxVcmwoKSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGFyZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJFeHRlbnNpb24gaW5zdGFsbGVkIHN1Y2Nlc3NmdWxseVwiLCBhcmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gV2UgbmVlZCB0byByZWxvYWQgdGhlIHBhZ2UgaW4gb3JkZXIgdG8gZ2V0IHRoZSBhY2Nlc3MgdG8gY2hyb21lLnJ1bnRpbWVcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoYXJnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZhaWxlZCB0byBpbnN0YWxsIHRoZSBleHRlbnNpb25cIiwgYXJnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhaWxDYWxsYmFjayhhcmcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgVUkubWVzc2FnZUhhbmRsZXIuc2hvd0Vycm9yKCdFcnJvcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0ZhaWxlZCB0byBpbnN0YWxsIGRlc2t0b3Agc2hhcmluZyBleHRlbnNpb24nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xufVxuXG4vKipcbiAqIENhbGwgdGhpcyBtZXRob2QgdG8gdG9nZ2xlIGRlc2t0b3Agc2hhcmluZyBmZWF0dXJlLlxuICogQHBhcmFtIG1ldGhvZCBwYXNzIFwiZXh0XCIgdG8gdXNlIGNocm9tZSBleHRlbnNpb24gZm9yIGRlc2t0b3AgY2FwdHVyZShjaHJvbWUgZXh0ZW5zaW9uIHJlcXVpcmVkKSxcbiAqICAgICAgICBwYXNzIFwid2VicnRjXCIgdG8gdXNlIFdlYlJUQyBcInNjcmVlblwiIGRlc2t0b3Agc291cmNlKCdjaHJvbWU6Ly9mbGFncy8jZW5hYmxlLXVzZXJtZWRpYS1zY3JlZW4tY2FwdHVyZSdcbiAqICAgICAgICBtdXN0IGJlIGVuYWJsZWQpLCBwYXNzIGFueSBvdGhlciBzdHJpbmcgb3Igbm90aGluZyBpbiBvcmRlciB0byBkaXNhYmxlIHRoaXMgZmVhdHVyZSBjb21wbGV0ZWx5LlxuICovXG5mdW5jdGlvbiBzZXREZXNrdG9wU2hhcmluZyhtZXRob2QpIHtcbiAgICAvLyBDaGVjayBpZiB3ZSBhcmUgcnVubmluZyBjaHJvbWVcbiAgICBpZiAoIW5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWEpIHtcbiAgICAgICAgb2J0YWluRGVza3RvcFN0cmVhbSA9IG51bGw7XG4gICAgICAgIGNvbnNvbGUuaW5mbyhcIkRlc2t0b3Agc2hhcmluZyBkaXNhYmxlZFwiKTtcbiAgICB9IGVsc2UgaWYgKG1ldGhvZCA9PSBcImV4dFwiKSB7XG4gICAgICAgIG9idGFpbkRlc2t0b3BTdHJlYW0gPSBvYnRhaW5TY3JlZW5Gcm9tRXh0ZW5zaW9uO1xuICAgICAgICBjb25zb2xlLmluZm8oXCJVc2luZyBDaHJvbWUgZXh0ZW5zaW9uIGZvciBkZXNrdG9wIHNoYXJpbmdcIik7XG4gICAgfSBlbHNlIGlmIChtZXRob2QgPT0gXCJ3ZWJydGNcIikge1xuICAgICAgICBvYnRhaW5EZXNrdG9wU3RyZWFtID0gb2J0YWluV2ViUlRDU2NyZWVuO1xuICAgICAgICBjb25zb2xlLmluZm8oXCJVc2luZyBDaHJvbWUgV2ViUlRDIGZvciBkZXNrdG9wIHNoYXJpbmdcIik7XG4gICAgfVxuXG4gICAgLy8gUmVzZXQgZW5hYmxlZCBjYWNoZVxuICAgIF9kZXNrdG9wU2hhcmluZ0VuYWJsZWQgPSBudWxsO1xufVxuXG4vKipcbiAqIEluaXRpYWxpemVzIDxsaW5rIHJlbD1jaHJvbWUtd2Vic3RvcmUtaXRlbSAvPiB3aXRoIGV4dGVuc2lvbiBpZCBzZXQgaW4gY29uZmlnLmpzIHRvIHN1cHBvcnQgaW5saW5lIGluc3RhbGxzLlxuICogSG9zdCBzaXRlIG11c3QgYmUgc2VsZWN0ZWQgYXMgbWFpbiB3ZWJzaXRlIG9mIHB1Ymxpc2hlZCBleHRlbnNpb24uXG4gKi9cbmZ1bmN0aW9uIGluaXRJbmxpbmVJbnN0YWxscygpXG57XG4gICAgJChcImxpbmtbcmVsPWNocm9tZS13ZWJzdG9yZS1pdGVtXVwiKS5hdHRyKFwiaHJlZlwiLCBnZXRXZWJTdG9yZUluc3RhbGxVcmwoKSk7XG59XG5cbmZ1bmN0aW9uIGdldFN3aXRjaFN0cmVhbUZhaWxlZChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgdG8gb2J0YWluIHRoZSBzdHJlYW0gdG8gc3dpdGNoIHRvXCIsIGVycm9yKTtcbiAgICBzd2l0Y2hJblByb2dyZXNzID0gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHN0cmVhbVN3aXRjaERvbmUoKSB7XG4gICAgc3dpdGNoSW5Qcm9ncmVzcyA9IGZhbHNlO1xuICAgIGV2ZW50RW1pdHRlci5lbWl0KFxuICAgICAgICBEZXNrdG9wU2hhcmluZ0V2ZW50VHlwZXMuU1dJVENISU5HX0RPTkUsXG4gICAgICAgIGlzVXNpbmdTY3JlZW5TdHJlYW0pO1xufVxuXG5mdW5jdGlvbiBuZXdTdHJlYW1DcmVhdGVkKHN0cmVhbSlcbntcbiAgICBldmVudEVtaXR0ZXIuZW1pdChEZXNrdG9wU2hhcmluZ0V2ZW50VHlwZXMuTkVXX1NUUkVBTV9DUkVBVEVELFxuICAgICAgICBzdHJlYW0sIGlzVXNpbmdTY3JlZW5TdHJlYW0sIHN0cmVhbVN3aXRjaERvbmUpO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGlzVXNpbmdTY3JlZW5TdHJlYW06IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGlzVXNpbmdTY3JlZW5TdHJlYW07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEByZXR1cm5zIHtib29sZWFufSA8dHQ+dHJ1ZTwvdHQ+IGlmIGRlc2t0b3Agc2hhcmluZyBmZWF0dXJlIGlzIGF2YWlsYWJsZSBhbmQgZW5hYmxlZC5cbiAgICAgKi9cbiAgICBpc0Rlc2t0b3BTaGFyaW5nRW5hYmxlZDogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoX2Rlc2t0b3BTaGFyaW5nRW5hYmxlZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKG9idGFpbkRlc2t0b3BTdHJlYW0gPT09IG9idGFpblNjcmVlbkZyb21FeHRlbnNpb24pIHtcbiAgICAgICAgICAgICAgICAvLyBQYXJzZSBjaHJvbWUgdmVyc2lvblxuICAgICAgICAgICAgICAgIHZhciB1c2VyQWdlbnQgPSBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICAgICAgLy8gV2UgY2FuIGFzc3VtZSB0aGF0IHVzZXIgYWdlbnQgaXMgY2hyb21lLCBiZWNhdXNlIGl0J3MgZW5mb3JjZWQgd2hlbiAnZXh0JyBzdHJlYW1pbmcgbWV0aG9kIGlzIHNldFxuICAgICAgICAgICAgICAgIHZhciB2ZXIgPSBwYXJzZUludCh1c2VyQWdlbnQubWF0Y2goL2Nocm9tZVxcLyhcXGQrKVxcLi8pWzFdLCAxMCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJDaHJvbWUgdmVyc2lvblwiICsgdXNlckFnZW50LCB2ZXIpO1xuICAgICAgICAgICAgICAgIF9kZXNrdG9wU2hhcmluZ0VuYWJsZWQgPSB2ZXIgPj0gMzQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIF9kZXNrdG9wU2hhcmluZ0VuYWJsZWQgPSBvYnRhaW5EZXNrdG9wU3RyZWFtID09PSBvYnRhaW5XZWJSVENTY3JlZW47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF9kZXNrdG9wU2hhcmluZ0VuYWJsZWQ7XG4gICAgfSxcbiAgICBcbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHNldERlc2t0b3BTaGFyaW5nKGNvbmZpZy5kZXNrdG9wU2hhcmluZyk7XG5cbiAgICAgICAgLy8gSW5pdGlhbGl6ZSBDaHJvbWUgZXh0ZW5zaW9uIGlubGluZSBpbnN0YWxsc1xuICAgICAgICBpZiAoY29uZmlnLmNocm9tZUV4dGVuc2lvbklkKSB7XG4gICAgICAgICAgICBpbml0SW5saW5lSW5zdGFsbHMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGV2ZW50RW1pdHRlci5lbWl0KERlc2t0b3BTaGFyaW5nRXZlbnRUeXBlcy5JTklUKTtcbiAgICB9LFxuXG4gICAgYWRkTGlzdGVuZXI6IGZ1bmN0aW9uKGxpc3RlbmVyLCB0eXBlKVxuICAgIHtcbiAgICAgICAgZXZlbnRFbWl0dGVyLm9uKHR5cGUsIGxpc3RlbmVyKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlTGlzdGVuZXI6IGZ1bmN0aW9uIChsaXN0ZW5lcix0eXBlKSB7XG4gICAgICAgIGV2ZW50RW1pdHRlci5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcik7XG4gICAgfSxcblxuICAgIC8qXG4gICAgICogVG9nZ2xlcyBzY3JlZW4gc2hhcmluZy5cbiAgICAgKi9cbiAgICB0b2dnbGVTY3JlZW5TaGFyaW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmIChzd2l0Y2hJblByb2dyZXNzIHx8ICFvYnRhaW5EZXNrdG9wU3RyZWFtKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJTd2l0Y2ggaW4gcHJvZ3Jlc3Mgb3Igbm8gbWV0aG9kIGRlZmluZWRcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgc3dpdGNoSW5Qcm9ncmVzcyA9IHRydWU7XG5cbiAgICAgICAgaWYgKCFpc1VzaW5nU2NyZWVuU3RyZWFtKVxuICAgICAgICB7XG4gICAgICAgICAgICAvLyBTd2l0Y2ggdG8gZGVza3RvcCBzdHJlYW1cbiAgICAgICAgICAgIG9idGFpbkRlc2t0b3BTdHJlYW0oXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBXZSBub3cgdXNlIHNjcmVlbiBzdHJlYW1cbiAgICAgICAgICAgICAgICAgICAgaXNVc2luZ1NjcmVlblN0cmVhbSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIEhvb2sgJ2VuZGVkJyBldmVudCB0byByZXN0b3JlIGNhbWVyYSB3aGVuIHNjcmVlbiBzdHJlYW0gc3RvcHNcbiAgICAgICAgICAgICAgICAgICAgc3RyZWFtLmFkZEV2ZW50TGlzdGVuZXIoJ2VuZGVkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzd2l0Y2hJblByb2dyZXNzICYmIGlzVXNpbmdTY3JlZW5TdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdG9nZ2xlU2NyZWVuU2hhcmluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgbmV3U3RyZWFtQ3JlYXRlZChzdHJlYW0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZ2V0U3dpdGNoU3RyZWFtRmFpbGVkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIERpc2FibGUgc2NyZWVuIHN0cmVhbVxuICAgICAgICAgICAgUlRDLmdldFVzZXJNZWRpYVdpdGhDb25zdHJhaW50cyhcbiAgICAgICAgICAgICAgICBbJ3ZpZGVvJ10sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBXZSBhcmUgbm93IHVzaW5nIGNhbWVyYSBzdHJlYW1cbiAgICAgICAgICAgICAgICAgICAgaXNVc2luZ1NjcmVlblN0cmVhbSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBuZXdTdHJlYW1DcmVhdGVkKHN0cmVhbSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBnZXRTd2l0Y2hTdHJlYW1GYWlsZWQsIGNvbmZpZy5yZXNvbHV0aW9uIHx8ICczNjAnXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIl19
