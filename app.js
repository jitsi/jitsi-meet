/* jshint -W117 */
/* application specific logic */
var nickname = null;
var focusMucJid = null;
var ssrc2jid = {};
//TODO: this array must be removed when firefox implement multistream support
var notReceivedSSRCs = [];

var jid2Ssrc = {};

/**
 * Indicates whether ssrc is camera video or desktop stream.
 * FIXME: remove those maps
 */
var ssrc2videoType = {};
/**
 * Currently focused video "src"(displayed in large video).
 * @type {String}
 */
var focusedVideoInfo = null;

function init() {

    RTC.start();
    xmpp.start(UI.getCreadentials);

}


$(document).ready(function () {

    if(API.isEnabled())
        API.init();

    UI.start();
    statistics.start();
    
    // Set default desktop sharing method
    desktopsharing.init();
});

$(window).bind('beforeunload', function () {
    if(API.isEnabled())
        API.dispose();
});

