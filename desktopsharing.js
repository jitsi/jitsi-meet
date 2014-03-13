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
 * @returns {boolean} <tt>true</tt> if desktop sharing feature is available and enabled.
 */
function isDesktopSharingEnabled() {
    // Desktop sharing must be enabled in config and works on chrome only.
    // Flag 'chrome://flags/#enable-usermedia-screen-capture' must be enabled.
    return config.chromeDesktopSharing && RTC.browser == 'chrome';
}

/*
 * Toggles screen sharing.
 */
function toggleScreenSharing() {
    if (!(connection && connection.connected
        && !switchInProgress
        && getConferenceHandler().peerconnection.signalingState == 'stable'
        && getConferenceHandler().peerconnection.iceConnectionState == 'connected')) {
        return;
    }
    switchInProgress = true;

    // Only the focus is able to set a shared key.
    if(!isUsingScreenStream)
    {
        // Enable screen stream
        getUserMediaWithConstraints(
            ['screen'],
            function(stream){
                isUsingScreenStream = true;
                gotScreenStream(stream);
            },
            getSwitchStreamFailed
        );
    } else {
        // Disable screen stream
        getUserMediaWithConstraints(
            ['video'],
            function(stream) {
                isUsingScreenStream = false;
                gotScreenStream(stream);
            },
            getSwitchStreamFailed, config.resolution || '360'
        );
    }
}

function getSwitchStreamFailed(error) {
    console.error("Failed to obtain the stream to switch to", error);
    switchInProgress = false;
}

function gotScreenStream(stream) {
    var oldStream = connection.jingle.localVideo;

    change_local_video(stream);

    // FIXME: will block switchInProgress on true value in case of exception
    getConferenceHandler().switchStreams(stream, oldStream, onDesktopStreamEnabled);
}

function onDesktopStreamEnabled() {
    // Wait a moment before enabling the button
    window.setTimeout(function() {
        switchInProgress = false;
    }, 3000);
}
