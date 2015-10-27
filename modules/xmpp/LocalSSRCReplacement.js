/* global $ */

/*
 Here we do modifications of local video SSRCs. There are 2 situations we have
 to handle:

 1. We generate SSRC for local recvonly video stream. This is the case when we
    have no local camera and it is not generated automatically, but SSRC=1 is
    used implicitly. If that happens RTCP packets will be dropped by the JVB
    and we won't be able to request video key frames correctly.

 2. A hack to re-use SSRC of the first video stream for any new stream created
    in future. It turned out that Chrome may keep on using the SSRC of removed
    video stream in RTCP even though a new one has been created. So we just
    want to avoid that by re-using it. Jingle 'source-remove'/'source-add'
    notifications are blocked once first video SSRC is advertised to the focus.

 What this hack does:

 1. Stores the SSRC of the first video stream created by
   a) scanning Jingle session-accept/session-invite for existing video SSRC
   b) watching for 'source-add' for new video stream if it has not been
      created in step a)
 2. Exposes method 'mungeLocalVideoSSRC' which replaces any new video SSRC with
    the stored one. It is called by 'TracablePeerConnection' before local SDP is
    returned to the other parts of the application.
 3. Scans 'source-remove'/'source-add' notifications for stored video SSRC and
    blocks those notifications. This makes Jicofo and all participants think
    that it exists all the time even if the video stream has been removed or
    replaced locally. Thanks to that there is no additional signaling activity
    on video mute or when switching to the desktop stream.
 */

var SDP = require('./SDP');
var RandomUtil = require('../util/RandomUtil');
var RTCBrowserType = require('../RTC/RTCBrowserType');

/**
 * The hack is enabled on all browsers except FF by default
 * FIXME finish the hack once removeStream method is implemented in FF
 * @type {boolean}
 */
var isEnabled = !RTCBrowserType.isFirefox();


/**
 * Stored SSRC of local video stream.
 */
var localVideoSSRC;

/**
 * SSRC, msid, mslabel, label used for recvonly video stream when we have no local camera.
 * This is in order to tell Chrome what SSRC should be used in RTCP requests
 * instead of 1.
 */
var localRecvOnlySSRC, localRecvOnlyMSID, localRecvOnlyMSLabel, localRecvOnlyLabel;

/**
 * cname for <tt>localRecvOnlySSRC</tt>
 */
var localRecvOnlyCName;

/**
 * Method removes <source> element which describes <tt>localVideoSSRC</tt>
 * from given Jingle IQ.
 * @param modifyIq 'source-add' or 'source-remove' Jingle IQ.
 * @param actionName display name of the action which will be printed in log
 *        messages.
 * @returns {*} modified Jingle IQ, so that it does not contain <source> element
 *          corresponding to <tt>localVideoSSRC</tt> or <tt>null</tt> if no
 *          other SSRCs left to be signaled after removing it.
 */
var filterOutSource = function (modifyIq, actionName) {
    var modifyIqTree = $(modifyIq.tree());

    if (!localVideoSSRC)
        return modifyIqTree[0];

    var videoSSRC = modifyIqTree.find(
        '>jingle>content[name="video"]' +
        '>description>source[ssrc="' + localVideoSSRC + '"]');

    if (!videoSSRC.length) {
        return modifyIqTree[0];
    }

    console.info(
        'Blocking ' + actionName + ' for local video SSRC: ' + localVideoSSRC);

    videoSSRC.remove();

    // Check if any sources still left to be added/removed
    if (modifyIqTree.find('>jingle>content>description>source').length) {
        return modifyIqTree[0];
    } else {
        return null;
    }
};

/**
 * Scans given Jingle IQ for video SSRC and stores it.
 * @param jingleIq the Jingle IQ to be scanned for video SSRC.
 */
var storeLocalVideoSSRC = function (jingleIq) {
    var videoSSRCs =
        $(jingleIq.tree())
            .find('>jingle>content[name="video"]>description>source');

    videoSSRCs.each(function (idx, ssrcElem) {
        if (localVideoSSRC)
            return;
        // We consider SSRC real only if it has msid attribute
        // recvonly streams in FF do not have it as well as local SSRCs
        // we generate for recvonly streams in Chrome
        var ssrSel = $(ssrcElem);
        var msid = ssrSel.find('>parameter[name="msid"]');
        if (msid.length) {
            var ssrcVal = ssrSel.attr('ssrc');
            if (ssrcVal) {
                localVideoSSRC = ssrcVal;
                console.info('Stored local video SSRC' +
                             ' for future re-use: ' + localVideoSSRC);
            }
        }
    });
};

/**
 * Generates new label/mslabel attribute
 * @returns {string} label/mslabel attribute
 */
function generateLabel() {
    return RandomUtil.random8digitsHex() + "-" + RandomUtil.random4digitsHex() + "-" +
           RandomUtil.random4digitsHex() + "-" + RandomUtil.random4digitsHex() + "-" + RandomUtil.random12digitsHex();
}

/**
 * Generates new SSRC, CNAME, mslabel, label and msid for local video recvonly stream.
 * FIXME what about eventual SSRC collision ?
 */
function generateRecvonlySSRC() {
    localRecvOnlySSRC =
        Math.random().toString(10).substring(2, 11);
    localRecvOnlyCName =
        Math.random().toString(36).substring(2);
    localRecvOnlyMSLabel = generateLabel();
    localRecvOnlyLabel = generateLabel();
    localRecvOnlyMSID = localRecvOnlyMSLabel + " " + localRecvOnlyLabel;


        console.info(
        "Generated local recvonly SSRC: " + localRecvOnlySSRC +
        ", cname: " + localRecvOnlyCName);
}

var LocalSSRCReplacement = {
    /**
     * Method must be called before 'session-initiate' or 'session-invite' is
     * sent. Scans the IQ for local video SSRC and stores it if detected.
     *
     * @param sessionInit our 'session-initiate' or 'session-accept' Jingle IQ
     *        which will be scanned for local video SSRC.
     */
    processSessionInit: function (sessionInit) {
        if (!isEnabled)
            return;

        if (localVideoSSRC) {
            console.error("Local SSRC stored already: " + localVideoSSRC);
            return;
        }
        storeLocalVideoSSRC(sessionInit);
    },
    /**
     * If we have local video SSRC stored searched given
     * <tt>localDescription</tt> for video SSRC and makes sure it is replaced
     * with the stored one.
     * @param localDescription local description object that will have local
     *        video SSRC replaced with the stored one
     * @returns modified <tt>localDescription</tt> object.
     */
    mungeLocalVideoSSRC: function (localDescription) {
        if (!isEnabled)
            return localDescription;

        if (!localDescription) {
            console.warn("localDescription is null or undefined");
            return localDescription;
        }

        // IF we have local video SSRC stored make sure it is replaced
        // with old SSRC
        if (localVideoSSRC) {
            var newSdp = new SDP(localDescription.sdp);
            if (newSdp.media[1].indexOf("a=ssrc:") !== -1 &&
                !newSdp.containsSSRC(localVideoSSRC)) {
                // Get new video SSRC
                var map = newSdp.getMediaSsrcMap();
                var videoPart = map[1];
                var videoSSRCs = videoPart.ssrcs;
                var newSSRC = Object.keys(videoSSRCs)[0];

                console.info(
                    "Replacing new video SSRC: " + newSSRC +
                    " with " + localVideoSSRC);

                localDescription.sdp =
                    newSdp.raw.replace(
                        new RegExp('a=ssrc:' + newSSRC, 'g'),
                        'a=ssrc:' + localVideoSSRC);
            }
        } else {
            // Make sure we have any SSRC for recvonly video stream
            var sdp = new SDP(localDescription.sdp);

            if (sdp.media[1] && sdp.media[1].indexOf('a=ssrc:') === -1 &&
                sdp.media[1].indexOf('a=recvonly') !== -1) {

                if (!localRecvOnlySSRC) {
                    generateRecvonlySSRC();
                }
                localVideoSSRC = localRecvOnlySSRC;

                console.info('No SSRC in video recvonly stream' +
                             ' - adding SSRC: ' + localRecvOnlySSRC);

                sdp.media[1] += 'a=ssrc:' + localRecvOnlySSRC +
                                ' cname:' + localRecvOnlyCName + '\r\n' +
                                'a=ssrc:' + localRecvOnlySSRC +
                                ' msid:' + localRecvOnlyMSID + '\r\n' +
                                'a=ssrc:' + localRecvOnlySSRC +
                                ' mslabel:' + localRecvOnlyMSLabel + '\r\n' +
                                'a=ssrc:' + localRecvOnlySSRC +
                                ' label:' + localRecvOnlyLabel + '\r\n';

                localDescription.sdp = sdp.session + sdp.media.join('');
            }
        }
        return localDescription;
    },
    /**
     * Method must be called before 'source-add' notification is sent. In case
     * we have local video SSRC advertised already it will be removed from the
     * notification. If no other SSRCs are described by given IQ null will be
     * returned which means that there is no point in sending the notification.
     * @param sourceAdd 'source-add' Jingle IQ to be processed
     * @returns modified 'source-add' IQ which can be sent to the focus or
     *          <tt>null</tt> if no notification shall be sent. It is no longer
     *          a Strophe IQ Builder instance, but DOM element tree.
     */
    processSourceAdd: function (sourceAdd) {
        if (!isEnabled)
            return sourceAdd;

        if (!localVideoSSRC) {
            // Store local SSRC if available
            storeLocalVideoSSRC(sourceAdd);
            return sourceAdd;
        } else {
            return filterOutSource(sourceAdd, 'source-add');
        }
    },
    /**
     * Method must be called before 'source-remove' notification is sent.
     * Removes local video SSRC from the notification. If there are no other
     * SSRCs described in the given IQ <tt>null</tt> will be returned which
     * means that there is no point in sending the notification.
     * @param sourceRemove 'source-remove' Jingle IQ to be processed
     * @returns modified 'source-remove' IQ which can be sent to the focus or
     *          <tt>null</tt> if no notification shall be sent. It is no longer
     *          a Strophe IQ Builder instance, but DOM element tree.
     */
    processSourceRemove: function (sourceRemove) {
        if (!isEnabled)
            return sourceRemove;

        return filterOutSource(sourceRemove, 'source-remove');
    },

    /**
     * Turns the hack on or off
     * @param enabled <tt>true</tt> to enable the hack or <tt>false</tt>
     *                to disable it
     */
    setEnabled: function (enabled) {
        isEnabled = enabled;
    }
};

module.exports = LocalSSRCReplacement;
