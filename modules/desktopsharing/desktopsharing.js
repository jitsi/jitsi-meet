/* global $, alert, APP, changeLocalVideo, chrome, config, getConferenceHandler,
 getUserMediaWithConstraints */
/**
 * Indicates that desktop stream is currently in use(for toggle purpose).
 * @type {boolean}
 */
var isUsingScreenStream = false;
/**
 * Indicates that switch stream operation is in progress and prevent from
 * triggering new events.
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
 * Indicates whether desktop sharing extension is installed.
 * @type {boolean}
 */
var extInstalled = false;

/**
 * Indicates whether update of desktop sharing extension is required.
 * @type {boolean}
 */
var extUpdateRequired = false;

/**
 * Flag used to cache desktop sharing enabled state. Do not use directly as
 * it can be <tt>null</tt>.
 *
 * @type {null|boolean}
 */
var _desktopSharingEnabled = null;

var EventEmitter = require("events");

var eventEmitter = new EventEmitter();

var DesktopSharingEventTypes
    = require("../../service/desktopsharing/DesktopSharingEventTypes");

/**
 * Method obtains desktop stream from WebRTC 'screen' source.
 * Flag 'chrome://flags/#enable-usermedia-screen-capture' must be enabled.
 */
function obtainWebRTCScreen(streamCallback, failCallback) {
    APP.RTC.getUserMediaWithConstraints(
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
    return "https://chrome.google.com/webstore/detail/" +
        config.chromeExtensionId;
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
        APP.UI.messageHandler.showError("dialog.error",
            "dialog.detectext");
        return true;
    }
}

function checkExtInstalled(callback) {
    if (!chrome.runtime) {
        // No API, so no extension for sure
        callback(false, false);
        return;
    }
    chrome.runtime.sendMessage(
        config.chromeExtensionId,
        { getVersion: true },
        function (response) {
            if (!response || !response.version) {
                // Communication failure - assume that no endpoint exists
                console.warn(
                    "Extension not installed?: ", chrome.runtime.lastError);
                callback(false, false);
                return;
            }
            // Check installed extension version
            var extVersion = response.version;
            console.log('Extension version is: ' + extVersion);
            var updateRequired
                = isUpdateRequired(config.minChromeExtVersion, extVersion);
            callback(!updateRequired, updateRequired);
        }
    );
}

function doGetStreamFromExtension(streamCallback, failCallback) {
    // Sends 'getStream' msg to the extension.
    // Extension id must be defined in the config.
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
                APP.RTC.getUserMediaWithConstraints(
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
 * Asks Chrome extension to call chooseDesktopMedia and gets chrome 'desktop'
 * stream for returned stream token.
 */
function obtainScreenFromExtension(streamCallback, failCallback) {
    if (extInstalled) {
        doGetStreamFromExtension(streamCallback, failCallback);
    } else {
        if (extUpdateRequired) {
            alert(
                'Jitsi Desktop Streamer requires update. ' +
                'Changes will take effect after next Chrome restart.');
        }

        chrome.webstore.install(
            getWebStoreInstallUrl(),
            function (arg) {
                console.log("Extension installed successfully", arg);
                extInstalled = true;
                // We need to give a moment for the endpoint to become available
                window.setTimeout(function () {
                    doGetStreamFromExtension(streamCallback, failCallback);
                }, 500);
            },
            function (arg) {
                console.log("Failed to install the extension", arg);
                failCallback(arg);
                APP.UI.messageHandler.showError("dialog.error",
                    "dialog.failtoinstall");
            }
        );
    }
}

/**
 * Call this method to toggle desktop sharing feature.
 * @param method pass "ext" to use chrome extension for desktop capture(chrome
 *        extension required), pass "webrtc" to use WebRTC "screen" desktop
 *        source('chrome://flags/#enable-usermedia-screen-capture' must be
 *        enabled), pass any other string or nothing in order to disable this
 *        feature completely.
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
 * Initializes <link rel=chrome-webstore-item /> with extension id set in
 * config.js to support inline installs. Host site must be selected as main
 * website of published extension.
 */
function initInlineInstalls()
{
    $("link[rel=chrome-webstore-item]").attr("href", getWebStoreInstallUrl());
}

function getVideoStreamFailed(error) {
    console.error("Failed to obtain the stream to switch to", error);
    switchInProgress = false;
    isUsingScreenStream = false;
    newStreamCreated(null);
}

function getDesktopStreamFailed(error) {
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
     * @returns {boolean} <tt>true</tt> if desktop sharing feature is available
     *          and enabled.
     */
    isDesktopSharingEnabled: function () {
        if (_desktopSharingEnabled === null) {
            if (obtainDesktopStream === obtainScreenFromExtension) {
                // Parse chrome version
                var userAgent = navigator.userAgent.toLowerCase();
                // We can assume that user agent is chrome, because it's
                // enforced when 'ext' streaming method is set
                var ver = parseInt(userAgent.match(/chrome\/(\d+)\./)[1], 10);
                console.log("Chrome version" + userAgent, ver);
                _desktopSharingEnabled = ver >= 34;
            } else {
                _desktopSharingEnabled =
                    obtainDesktopStream === obtainWebRTCScreen;
            }
        }
        return _desktopSharingEnabled;
    },
    
    init: function () {
        setDesktopSharing(config.desktopSharing);

        // Initialize Chrome extension inline installs
        if (config.chromeExtensionId) {

            initInlineInstalls();

            // Check if extension is installed
            checkExtInstalled(function (installed, updateRequired) {
                extInstalled = installed;
                extUpdateRequired = updateRequired;
                console.info(
                    "Chrome extension installed: " + extInstalled +
                    " updateRequired: " + extUpdateRequired);
            });
        }

        eventEmitter.emit(DesktopSharingEventTypes.INIT);
    },

    addListener: function (listener, type)
    {
        eventEmitter.on(type, listener);
    },

    removeListener: function (listener, type) {
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
                    // Hook 'ended' event to restore camera
                    // when screen stream stops
                    stream.addEventListener('ended',
                        function (e) {
                            if (!switchInProgress && isUsingScreenStream) {
                                APP.desktopsharing.toggleScreenSharing();
                            }
                        }
                    );
                    newStreamCreated(stream);
                },
                getDesktopStreamFailed);
        } else {
            // Disable screen stream
            APP.RTC.getUserMediaWithConstraints(
                ['video'],
                function (stream) {
                    // We are now using camera stream
                    isUsingScreenStream = false;
                    newStreamCreated(stream);
                },
                getVideoStreamFailed, config.resolution || '360'
            );
        }
    }
};

