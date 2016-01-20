/* global chrome, $, alert */
/* jshint -W003 */
var logger = require("jitsi-meet-logger").getLogger(__filename);
var RTCBrowserType = require("./RTCBrowserType");
var AdapterJS = require("./adapter.screenshare");
var DesktopSharingEventTypes
    = require("../../service/desktopsharing/DesktopSharingEventTypes");
var JitsiTrackErrors = require("../../JitsiTrackErrors");

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
 * Whether the jidesha extension for firefox is installed for the domain on
 * which we are running. Null designates an unknown value.
 * @type {null}
 */
var firefoxExtInstalled = null;

/**
 * If set to true, detection of an installed firefox extension will be started
 * again the next time obtainScreenOnFirefox is called (e.g. next time the
 * user tries to enable screen sharing).
 */
var reDetectFirefoxExtension = false;

var GUM = null;

/**
 * Handles obtaining a stream from a screen capture on different browsers.
 */
var ScreenObtainer = {
    obtainStream: null,
    /**
     * Initializes the function used to obtain a screen capture
     * (this.obtainStream).
     *
     * If the browser is Chrome, it uses the value of
     * 'options.desktopSharingChromeMethod' (or 'options.desktopSharing') to
     * decide whether to use the a Chrome extension (if the value is 'ext'),
     * use the "screen" media source (if the value is 'webrtc'),
     * or disable screen capture (if the value is other).
     * Note that for the "screen" media source to work the
     * 'chrome://flags/#enable-usermedia-screen-capture' flag must be set.
     */
    init: function(options, gum) {
        var obtainDesktopStream = null;
        this.options = options = options || {};
        GUM = gum;

        if (RTCBrowserType.isFirefox())
            initFirefoxExtensionDetection(options);

        // TODO remove this, options.desktopSharing is deprecated.
        var chromeMethod =
            (options.desktopSharingChromeMethod || options.desktopSharing);

        if (RTCBrowserType.isTemasysPluginUsed()) {
            if (!AdapterJS.WebRTCPlugin.plugin.HasScreensharingFeature) {
                logger.info("Screensharing not supported by this plugin " +
                    "version");
            } else if(!AdapterJS.WebRTCPlugin.plugin.isScreensharingAvailable) {
                logger.info(
                    "Screensharing not available with Temasys plugin on" +
                    " this site");
            } else {
                obtainDesktopStream = obtainWebRTCScreen;
                logger.info("Using Temasys plugin for desktop sharing");
            }
        } else if (RTCBrowserType.isChrome()) {
            if (chromeMethod == "ext") {
                if (RTCBrowserType.getChromeVersion() >= 34) {
                    obtainDesktopStream =
                        this.obtainScreenFromExtension;
                    logger.info("Using Chrome extension for desktop sharing");
                    initChromeExtension(options);
                } else {
                    logger.info("Chrome extension not supported until ver 34");
                }
            } else if (chromeMethod == "webrtc") {
                obtainDesktopStream = obtainWebRTCScreen;
                logger.info("Using Chrome WebRTC for desktop sharing");
            }
        } else if (RTCBrowserType.isFirefox()) {
            if (options.desktopSharingFirefoxDisabled) {
                obtainDesktopStream = null;
            } else if (window.location.protocol === "http:"){
                logger.log("Screen sharing is not supported over HTTP. " +
                    "Use of HTTPS is required.");
                obtainDesktopStream = null;
            } else {
                obtainDesktopStream = this.obtainScreenOnFirefox;
            }

        }

        if (!obtainDesktopStream) {
            logger.info("Desktop sharing disabled");
        }

        this.obtainStream = obtainDesktopStream;
    },

    /**
     * Checks whether obtaining a screen capture is supported in the current
     * environment.
     * @returns {boolean}
     */
    isSupported: function() {
        return !!this.obtainStream;
    },
    /**
     * Obtains a screen capture stream on Firefox.
     * @param callback
     * @param errorCallback
     */
    obtainScreenOnFirefox:
           function (callback, errorCallback) {
        var self = this;
        var extensionRequired = false;
        if (this.options.desktopSharingFirefoxMaxVersionExtRequired === -1 ||
            (this.options.desktopSharingFirefoxMaxVersionExtRequired >= 0 &&
                RTCBrowserType.getFirefoxVersion() <=
                    this.options.desktopSharingFirefoxMaxVersionExtRequired)) {
            extensionRequired = true;
            logger.log("Jidesha extension required on firefox version " +
                RTCBrowserType.getFirefoxVersion());
        }

        if (!extensionRequired || firefoxExtInstalled === true) {
            obtainWebRTCScreen(callback, errorCallback);
            return;
        }

        if (reDetectFirefoxExtension) {
            reDetectFirefoxExtension = false;
            initFirefoxExtensionDetection(this.options);
        }

        // Give it some (more) time to initialize, and assume lack of
        // extension if it hasn't.
        if (firefoxExtInstalled === null) {
            window.setTimeout(
                function() {
                    if (firefoxExtInstalled === null)
                        firefoxExtInstalled = false;
                    self.obtainScreenOnFirefox(callback, errorCallback);
                },
                300
            );
            logger.log("Waiting for detection of jidesha on firefox to " +
                "finish.");
            return;
        }

        // We need an extension and it isn't installed.

        // Make sure we check for the extension when the user clicks again.
        firefoxExtInstalled = null;
        reDetectFirefoxExtension = true;

        // Make sure desktopsharing knows that we failed, so that it doesn't get
        // stuck in 'switching' mode.
        errorCallback(JitsiTrackErrors.FIREFOX_EXTENSION_NEEDED);
    },
    /**
     * Asks Chrome extension to call chooseDesktopMedia and gets chrome
     * 'desktop' stream for returned stream token.
     */
    obtainScreenFromExtension: function (streamCallback, failCallback) {
        var self = this;
        if (chromeExtInstalled) {
            doGetStreamFromExtension(this.options, streamCallback,
                failCallback);
        } else {
            if (chromeExtUpdateRequired) {
                alert(
                    'Jitsi Desktop Streamer requires update. ' +
                    'Changes will take effect after next Chrome restart.');
            }

            chrome.webstore.install(
                getWebStoreInstallUrl(this.options),
                function (arg) {
                    logger.log("Extension installed successfully", arg);
                    chromeExtInstalled = true;
                    // We need to give a moment for the endpoint to become
                    // available
                    window.setTimeout(function () {
                        doGetStreamFromExtension(self.options, streamCallback,
                            failCallback);
                    }, 500);
                },
                function (arg) {
                    logger.log("Failed to install the extension", arg);
                    failCallback(arg);
                }
            );
        }
    }
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
    GUM(
        ['screen'],
        streamCallback,
        failCallback
    );
}

/**
 * Constructs inline install URL for Chrome desktop streaming extension.
 * The 'chromeExtensionId' must be defined in options parameter.
 * @param options supports "desktopSharingChromeExtId" and "chromeExtensionId"
 * @returns {string}
 */
function getWebStoreInstallUrl(options)
{
    //TODO remove chromeExtensionId (deprecated)
    return "https://chrome.google.com/webstore/detail/" +
        (options.desktopSharingChromeExtId || options.chromeExtensionId);
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
        logger.error("Failed to parse extension version", e);
        return true;
    }
}

function checkChromeExtInstalled(callback, options) {
    if (!chrome || !chrome.runtime) {
        // No API, so no extension for sure
        callback(false, false);
        return;
    }
    chrome.runtime.sendMessage(
        //TODO: remove chromeExtensionId (deprecated)
        (options.desktopSharingChromeExtId || options.chromeExtensionId),
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
            //TODO: remove minChromeExtVersion (deprecated)
            var updateRequired
                = isUpdateRequired(
                    (options.desktopSharingChromeMinExtVersion ||
                        options.minChromeExtVersion),
                    extVersion);
            callback(!updateRequired, updateRequired);
        }
    );
}

function doGetStreamFromExtension(options, streamCallback, failCallback) {
    // Sends 'getStream' msg to the extension.
    // Extension id must be defined in the config.
    chrome.runtime.sendMessage(
        //TODO: remove chromeExtensionId (deprecated)
        (options.desktopSharingChromeExtId || options.chromeExtensionId),
        {
            getStream: true,
            //TODO: remove desktopSharingSources (deprecated).
            sources: (options.desktopSharingChromeSources ||
                options.desktopSharingSources)
        },
        function (response) {
            if (!response) {
                failCallback(chrome.runtime.lastError);
                return;
            }
            logger.log("Response from extension: " + response);
            if (response.streamId) {
                GUM(
                    ['desktop'],
                    function (stream) {
                        streamCallback(stream);
                    },
                    failCallback,
                    {desktopStream: response.streamId});
            } else {
                failCallback("Extension failed to get the stream");
            }
        }
    );
}

/**
 * Initializes <link rel=chrome-webstore-item /> with extension id set in
 * config.js to support inline installs. Host site must be selected as main
 * website of published extension.
 * @param options supports "desktopSharingChromeExtId" and "chromeExtensionId"
 */
function initInlineInstalls(options)
{
    $("link[rel=chrome-webstore-item]").attr("href",
        getWebStoreInstallUrl(options));
}

function initChromeExtension(options) {
    // Initialize Chrome extension inline installs
    initInlineInstalls(options);
    // Check if extension is installed
    checkChromeExtInstalled(function (installed, updateRequired) {
        chromeExtInstalled = installed;
        chromeExtUpdateRequired = updateRequired;
        logger.info(
            "Chrome extension installed: " + chromeExtInstalled +
            " updateRequired: " + chromeExtUpdateRequired);
    }, options);
}

/**
 * Starts the detection of an installed jidesha extension for firefox.
 * @param options supports "desktopSharingFirefoxDisabled",
 * "desktopSharingFirefoxExtId" and "chromeExtensionId"
 */
function initFirefoxExtensionDetection(options) {
    if (options.desktopSharingFirefoxDisabled) {
        return;
    }
    if (firefoxExtInstalled === false || firefoxExtInstalled === true)
        return;
    if (!options.desktopSharingFirefoxExtId) {
        firefoxExtInstalled = false;
        return;
    }

    var img = document.createElement('img');
    img.onload = function(){
        logger.log("Detected firefox screen sharing extension.");
        firefoxExtInstalled = true;
    };
    img.onerror = function(){
        logger.log("Detected lack of firefox screen sharing extension.");
        firefoxExtInstalled = false;
    };

    // The jidesha extension exposes an empty image file under the url:
    // "chrome://EXT_ID/content/DOMAIN.png"
    // Where EXT_ID is the ID of the extension with "@" replaced by ".", and
    // DOMAIN is a domain whitelisted by the extension.
    var src = "chrome://" +
        (options.desktopSharingFirefoxExtId.replace('@', '.')) +
        "/content/" + document.location.hostname + ".png";
    img.setAttribute('src', src);
}

module.exports = ScreenObtainer;
