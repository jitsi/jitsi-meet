/* global config, APP, chrome, $, alert */
/* jshint -W003 */
var RTCBrowserType = require("../RTC/RTCBrowserType");
var AdapterJS = require("../RTC/adapter.screenshare");

/**
 * Indicates whether the Chrome desktop sharing extension is installed.
 * @type {boolean}
 */
var chromeExtInstalled = false;
/**
 * Indicates whether an update of the Chrome desktop sharing extension is
 * required.
 * @type {boolean}
 */
var chromeExtUpdateRequired = false;

/**
 * Handles obtaining a stream from a screen capture on different browsers.
 */
function ScreenObtainer(){
}

/**
 * Initializes the function used to obtain a screen capture (this.obtainStream).
 *
 * If the browser is Chrome, it uses the value of 'config.desktopSharing' to
 * decide whether to use the a Chrome extension (if the value is 'ext'), use
 * the "screen" media source (if the value is 'webrtc'), or disable screen
 * capture (if the value is other).
 * Note that for the "screen" media source to work the
 * 'chrome://flags/#enable-usermedia-screen-capture' flag must be set.
 */
ScreenObtainer.prototype.init = function() {
    var obtainDesktopStream = null;

    // When TemasysWebRTC plugin is used we always use getUserMedia, so we don't
    // care about the value of config.desktopSharing.
    if (RTCBrowserType.isTemasysPluginUsed()) {
        if (!AdapterJS.WebRTCPlugin.plugin.HasScreensharingFeature) {
            console.info("Screensharing not supported by this plugin version");
        } else if (!AdapterJS.WebRTCPlugin.plugin.isScreensharingAvailable) {
            console.info(
                "Screensharing not available with Temasys plugin on this site");
        } else {
            obtainDesktopStream = obtainWebRTCScreen;
            console.info("Using Temasys plugin for desktop sharing");
        }
    } else if (RTCBrowserType.isChrome()) {
        if (config.desktopSharing == "ext") {
            if (RTCBrowserType.getChromeVersion() >= 34) {
                obtainDesktopStream = obtainScreenFromExtension;
                console.info("Using Chrome extension for desktop sharing");
                initChromeExtension();
            } else {
                console.info("Chrome extension not supported until ver 34");
            }
        } else if (config.desktopSharing == "webrtc") {
            obtainDesktopStream = obtainWebRTCScreen;
            console.info("Using Chrome WebRTC for desktop sharing");
        }
    } else if (RTCBrowserType.isFirefox()) {
        obtainDesktopStream = obtainWebRTCScreen;
    }

    if (!obtainDesktopStream) {
        console.info("Desktop sharing disabled");
    }

    ScreenObtainer.prototype.obtainStream = obtainDesktopStream.bind(this);
};

ScreenObtainer.prototype.obtainStream = null;

/**
 * Checks whether obtaining a screen capture is supported in the current
 * environment.
 * @returns {boolean}
 */
ScreenObtainer.prototype.isSupported = function() {
    return !!this.obtainStream;
};

/**
 * Obtains a desktop stream using getUserMedia.
 * For this to work on Chrome, the
 * 'chrome://flags/#enable-usermedia-screen-capture' flag must be enabled.
 *
 * On firefox, the document's domain must be white-listed in the
 * 'media.getusermedia.screensharing.allowed_domains' preference in
 * 'about:config'.
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
 * Checks whether an update of the Chrome extension is required.
 * @param minVersion minimal required version
 * @param extVersion current extension version
 * @returns {boolean}
 */
function isUpdateRequired(minVersion, extVersion) {
    try {
        var s1 = minVersion.split('.');
        var s2 = extVersion.split('.');

        var len = Math.max(s1.length, s2.length);
        for (var i = 0; i < len; i++) {
            var n1 = 0,
                n2 = 0;

            if (i < s1.length)
                n1 = parseInt(s1[i]);
            if (i < s2.length)
                n2 = parseInt(s2[i]);

            if (isNaN(n1) || isNaN(n2)) {
                return true;
            } else if (n1 !== n2) {
                return n1 > n2;
            }
        }

        // will happen if both versions have identical numbers in
        // their components (even if one of them is longer, has more components)
        return false;
    }
    catch (e) {
        console.error("Failed to parse extension version", e);
        APP.UI.messageHandler.showError("dialog.error",
            "dialog.detectext");
        return true;
    }
}

function checkChromeExtInstalled(callback) {
    if (!chrome || !chrome.runtime) {
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
    if (chromeExtInstalled) {
        doGetStreamFromExtension(streamCallback, failCallback);
    } else {
        if (chromeExtUpdateRequired) {
            alert(
                'Jitsi Desktop Streamer requires update. ' +
                'Changes will take effect after next Chrome restart.');
        }

        chrome.webstore.install(
            getWebStoreInstallUrl(),
            function (arg) {
                console.log("Extension installed successfully", arg);
                chromeExtInstalled = true;
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
        chromeExtInstalled = installed;
        chromeExtUpdateRequired = updateRequired;
        console.info(
            "Chrome extension installed: " + chromeExtInstalled +
            " updateRequired: " + chromeExtUpdateRequired);
    });
}


module.exports = ScreenObtainer;
