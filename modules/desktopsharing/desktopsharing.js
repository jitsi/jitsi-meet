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


var logger = require("jitsi-meet-logger").getLogger(__filename);
var AdapterJS = require("../RTC/adapter.screenshare");

var EventEmitter = require("events");

var eventEmitter = new EventEmitter();

var DesktopSharingEventTypes
    = require("../../service/desktopsharing/DesktopSharingEventTypes");

var RTCBrowserType = require("../RTC/RTCBrowserType");

var RTCEvents = require("../../service/RTC/RTCEvents");

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
        logger.error("Failed to parse extension version", e);
        APP.UI.messageHandler.showError("dialog.error",
            "dialog.detectext");
        return true;
    }
}

function checkChromeExtInstalled(callback) {
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
                logger.warn(
                    "Extension not installed?: ", chrome.runtime.lastError);
                callback(false, false);
                return;
            }
            // Check installed extension version
            var extVersion = response.version;
            logger.log('Extension version is: ' + extVersion);
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
            logger.log("Response from extension: " + response);
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
                logger.log("Extension installed successfully", arg);
                extInstalled = true;
                // We need to give a moment for the endpoint to become available
                window.setTimeout(function () {
                    doGetStreamFromExtension(streamCallback, failCallback);
                }, 500);
            },
            function (arg) {
                logger.log("Failed to install the extension", arg);
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

    obtainDesktopStream = null;

    // When TemasysWebRTC plugin is used we always use getUserMedia, so we don't
    // care about 'method' parameter
    if (RTCBrowserType.isTemasysPluginUsed()) {
        if (!AdapterJS.WebRTCPlugin.plugin.HasScreensharingFeature) {
            logger.info("Screensharing not supported by this plugin version");
        } else if (!AdapterJS.WebRTCPlugin.plugin.isScreensharingAvailable) {
            logger.info(
            "Screensharing not available with Temasys plugin on this site");
        } else {
            obtainDesktopStream = obtainWebRTCScreen;
            logger.info("Using Temasys plugin for desktop sharing");
        }
    } else if (RTCBrowserType.isChrome()) {
        if (method == "ext") {
            if (RTCBrowserType.getChromeVersion() >= 34) {
                obtainDesktopStream = obtainScreenFromExtension;
                logger.info("Using Chrome extension for desktop sharing");
                initChromeExtension();
            } else {
                logger.info("Chrome extension not supported until ver 34");
            }
        } else if (method == "webrtc") {
            obtainDesktopStream = obtainWebRTCScreen;
            logger.info("Using Chrome WebRTC for desktop sharing");
        }
    }

    if (!obtainDesktopStream) {
        logger.info("Desktop sharing disabled");
    }
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

function initChromeExtension() {
    // Initialize Chrome extension inline installs
    initInlineInstalls();
    // Check if extension is installed
    checkChromeExtInstalled(function (installed, updateRequired) {
        extInstalled = installed;
        extUpdateRequired = updateRequired;
        logger.info(
            "Chrome extension installed: " + extInstalled +
            " updateRequired: " + extUpdateRequired);
    });
}

function getVideoStreamFailed(error) {
    logger.error("Failed to obtain the stream to switch to", error);
    switchInProgress = false;
    isUsingScreenStream = false;
    newStreamCreated(null);
}

function getDesktopStreamFailed(error) {
    logger.error("Failed to obtain the stream to switch to", error);
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

function onEndedHandler(stream) {
    if (!switchInProgress && isUsingScreenStream) {
        APP.desktopsharing.toggleScreenSharing();
    }
    //FIXME: to be verified
    if (stream.removeEventListener) {
        stream.removeEventListener('ended', onEndedHandler);
    } else {
        stream.detachEvent('ended', onEndedHandler);
    }
}

// Called when RTC finishes initialization
function onWebRtcReady() {

    setDesktopSharing(config.desktopSharing);

    eventEmitter.emit(DesktopSharingEventTypes.INIT);
}

module.exports = {
    isUsingScreenStream: function () {
        return isUsingScreenStream;
    },

    /**
     * @returns {boolean} <tt>true</tt> if desktop sharing feature is available
     *          and enabled.
     */
    isDesktopSharingEnabled: function () { return !!obtainDesktopStream; },
    
    init: function () {
        APP.RTC.addListener(RTCEvents.RTC_READY, onWebRtcReady);
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
            logger.warn("Switch in progress or no method defined");
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
                    //FIXME: to be verified
                    if (stream.addEventListener) {
                        stream.addEventListener('ended', function () {
                            onEndedHandler(stream);
                        });
                    } else {
                        stream.attachEvent('ended', function () {
                            onEndedHandler(stream);
                        });
                    }
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

