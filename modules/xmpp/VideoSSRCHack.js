/* global $ */

/*
 The purpose of this hack is to re-use SSRC of first video stream ever created
 for any video streams created later on. In order to do that this hack:

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

/**
 * Stored SSRC of local video stream.
 */
var localVideoSSRC;

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
    if (!localVideoSSRC)
        return modifyIq;

    var modifyIqTree = $(modifyIq.tree());
    var videoSSRC = modifyIqTree.find(
        '>jingle>content[name="video"]' +
        '>description>source[ssrc="' + localVideoSSRC + '"]');

    if (!videoSSRC.length) {
        return modifyIqTree;
    }

    console.info(
        'Blocking ' + actionName + ' for local video SSRC: ' + localVideoSSRC);

    videoSSRC.remove();

    // Check if any sources still left to be added/removed
    if (modifyIqTree.find('>jingle>content>description>source').length) {
        return modifyIqTree;
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

    console.info('Video desc: ', videoSSRCs);
    if (!videoSSRCs.length)
        return;

    var ssrc = videoSSRCs.attr('ssrc');
    if (ssrc) {
        localVideoSSRC = ssrc;
        console.info(
            'Stored local video SSRC for future re-use: ' + localVideoSSRC);
    } else {
        console.error('No "ssrc" attribute present in <source> element');
    }
};

var LocalVideoSSRCHack = {
    /**
     * Method must be called before 'session-initiate' or 'session-invite' is
     * sent. Scans the IQ for local video SSRC and stores it if detected.
     *
     * @param sessionInit our 'session-initiate' or 'session-accept' Jingle IQ
     *        which will be scanned for local video SSRC.
     */
    processSessionInit: function (sessionInit) {
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
        return filterOutSource(sourceRemove, 'source-remove');
    }
};

module.exports = LocalVideoSSRCHack;
