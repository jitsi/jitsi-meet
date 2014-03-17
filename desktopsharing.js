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
 * @type {function(stream_callback, failure_callback}
 */
var obtainDesktopStream = obtainScreenFromExtension;

/**
 * Desktop sharing must be enabled in config and works on chrome only.
 */
var desktopSharingEnabled = config.desktopSharing;

/**
 * @returns {boolean} <tt>true</tt> if desktop sharing feature is available and enabled.
 */
function isDesktopSharingEnabled() {
    return desktopSharingEnabled;
}

/**
 * Call this method to toggle desktop sharing feature.
 * @param method pass "ext" to use chrome extension for desktop capture(chrome extension required),
 *        pass "webrtc" to use WebRTC "screen" desktop source('chrome://flags/#enable-usermedia-screen-capture'
 *        must be enabled), pass any other string or nothing in order to disable this feature completely.
 */
function setDesktopSharing(method) {
    if(method == "ext") {
        obtainDesktopStream = obtainScreenFromExtension;
        desktopSharingEnabled = true;
    } else if(method == "webrtc") {
        obtainDesktopStream = obtainWebRTCScreen;
        desktopSharingEnabled = true;
    } else {
        obtainDesktopStream = null;
        desktopSharingEnabled = false;
    }
    showDesktopSharingButton();
}

/*
 * Toggles screen sharing.
 */
function toggleScreenSharing() {
    if (!(connection && connection.connected
        && !switchInProgress
        && getConferenceHandler().peerconnection.signalingState == 'stable'
        && getConferenceHandler().peerconnection.iceConnectionState == 'connected'
        && obtainDesktopStream )) {
        return;
    }
    switchInProgress = true;

    // Only the focus is able to set a shared key.
    if(!isUsingScreenStream)
    {
        obtainDesktopStream(
            function(stream) {
                // We now use screen stream
                isUsingScreenStream = true;
                // Hook 'ended' event to restore camera when screen stream stops
                stream.addEventListener('ended',
                    function(e) {
                        if(!switchInProgress) {
                            toggleScreenSharing();
                        }
                    }
                );
                newStreamCreated(stream);
            },
            getSwitchStreamFailed );
    } else {
        // Disable screen stream
        getUserMediaWithConstraints(
            ['video'],
            function(stream) {
                // We are now using camera stream
                isUsingScreenStream = false;
                newStreamCreated(stream);
            },
            getSwitchStreamFailed, config.resolution || '360'
        );
    }
}

function getSwitchStreamFailed(error) {
    console.error("Failed to obtain the stream to switch to", error);
    switchInProgress = false;
}

function newStreamCreated(stream) {

    var oldStream = connection.jingle.localVideo;

    change_local_video(stream, !isUsingScreenStream);

    // FIXME: will block switchInProgress on true value in case of exception
    getConferenceHandler().switchStreams(
        stream, oldStream,
        function() {
            // Switch operation has finished
            switchInProgress = false;
        });
}

/**
 * Method obtains desktop stream from WebRTC 'screen' source.
 * Flag 'chrome://flags/#enable-usermedia-screen-capture' must be enabled.
 */
function obtainWebRTCScreen(streamCallback, failCallback) {
    getUserMediaWithConstraints(
        ['screen'],
        streamCallback,
        failCallback
    );
}

/**
 * Asks Chrome extension to call chooseDesktopMedia and gets chrome 'desktop' stream for returned stream token.
 */
function obtainScreenFromExtension(streamCallback, failCallback) {
    // Check for extension API
    if(!chrome || !chrome.runtime) {
        failCallback("Failed to communicate with extension - no API available");
        return;
    }
    // Sends 'getStream' msg to the extension. Extension id must be defined in the config.
    chrome.runtime.sendMessage(
        config.chromeExtensionId,
        { getStream: true},
        function(response) {
            if(!response) {
                failCallback(chrome.runtime.lastError);
                return;
            }
            console.log("Response from extension: "+response);
            if(response.streamId) {
                getUserMediaWithConstraints(
                    ['desktop'],
                    function(stream) {
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
