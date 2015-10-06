/* global $, APP, require, Strophe, interfaceConfig */
var ConnectionIndicator = require("./ConnectionIndicator");
var SmallVideo = require("./SmallVideo");
var AudioLevels = require("../audio_levels/AudioLevels");
var RTCBrowserType = require("../../RTC/RTCBrowserType");
var UIUtils = require("../util/UIUtil");
var XMPPEvents = require("../../../service/xmpp/XMPPEvents");

function RemoteVideo(peerJid, VideoLayout) {
    this.peerJid = peerJid;
    this.resourceJid = Strophe.getResourceFromJid(peerJid);
    this.videoSpanId = 'participant_' + this.resourceJid;
    this.VideoLayout = VideoLayout;
    this.addRemoteVideoContainer();
    this.connectionIndicator = new ConnectionIndicator(
        this, this.peerJid);
    this.setDisplayName();
    var nickfield = document.createElement('span');
    nickfield.className = "nick";
    nickfield.appendChild(document.createTextNode(this.resourceJid));
    this.container.appendChild(nickfield);
    this.bindHoverHandler();
    this.flipX = false;
    this.isLocal = false;
}

RemoteVideo.prototype = Object.create(SmallVideo.prototype);
RemoteVideo.prototype.constructor = RemoteVideo;

RemoteVideo.prototype.addRemoteVideoContainer = function() {
    this.container = RemoteVideo.createContainer(this.videoSpanId);
    if (APP.xmpp.isModerator())
        this.addRemoteVideoMenu();
    AudioLevels.updateAudioLevelCanvas(this.peerJid, this.VideoLayout);

    return this.container;
};

/**
 * Adds the remote video menu element for the given <tt>jid</tt> in the
 * given <tt>parentElement</tt>.
 *
 * @param jid the jid indicating the video for which we're adding a menu.
 * @param parentElement the parent element where this menu will be added
 */

if (!interfaceConfig.filmStripOnly) {
    RemoteVideo.prototype.addRemoteVideoMenu = function () {
        var spanElement = document.createElement('span');
        spanElement.className = 'remotevideomenu';

        this.container.appendChild(spanElement);

        var menuElement = document.createElement('i');
        menuElement.className = 'fa fa-angle-down';
        menuElement.title = 'Remote user controls';
        spanElement.appendChild(menuElement);


        var popupmenuElement = document.createElement('ul');
        popupmenuElement.className = 'popupmenu';
        popupmenuElement.id = 'remote_popupmenu_' + this.getResourceJid();
        spanElement.appendChild(popupmenuElement);

        var muteMenuItem = document.createElement('li');
        var muteLinkItem = document.createElement('a');

        var mutedIndicator = "<i style='float:left;' " +
            "class='icon-mic-disabled'></i>";

        if (!this.isMuted) {
            muteLinkItem.innerHTML = mutedIndicator +
                " <div style='width: 90px;margin-left: 20px;' " +
                "data-i18n='videothumbnail.domute'></div>";
            muteLinkItem.className = 'mutelink';
        }
        else {
            muteLinkItem.innerHTML = mutedIndicator +
                " <div style='width: 90px;margin-left: 20px;' " +
                "data-i18n='videothumbnail.muted'></div>";
            muteLinkItem.className = 'mutelink disabled';
        }

        var self = this;
        muteLinkItem.onclick = function(){
            if ($(this).attr('disabled')) {
                event.preventDefault();
            }
            var isMute = !!self.isMuted;
            APP.xmpp.setMute(self.peerJid, !isMute);

            popupmenuElement.setAttribute('style', 'display:none;');

            if (isMute) {
                this.innerHTML = mutedIndicator +
                    " <div style='width: 90px;margin-left: 20px;' " +
                    "data-i18n='videothumbnail.muted'></div>";
                this.className = 'mutelink disabled';
            }
            else {
                this.innerHTML = mutedIndicator +
                    " <div style='width: 90px;margin-left: 20px;' " +
                    "data-i18n='videothumbnail.domute'></div>";
                this.className = 'mutelink';
            }
        };

        muteMenuItem.appendChild(muteLinkItem);
        popupmenuElement.appendChild(muteMenuItem);

        var ejectIndicator = "<i style='float:left;' class='fa fa-eject'></i>";

        var ejectMenuItem = document.createElement('li');
        var ejectLinkItem = document.createElement('a');
        var ejectText = "<div style='width: 90px;margin-left: 20px;' " +
            "data-i18n='videothumbnail.kick'>&nbsp;</div>";
        ejectLinkItem.innerHTML = ejectIndicator + ' ' + ejectText;
        ejectLinkItem.onclick = function(){
            APP.xmpp.eject(self.peerJid);
            popupmenuElement.setAttribute('style', 'display:none;');
        };

        ejectMenuItem.appendChild(ejectLinkItem);
        popupmenuElement.appendChild(ejectMenuItem);

        var paddingSpan = document.createElement('span');
        paddingSpan.className = 'popupmenuPadding';
        popupmenuElement.appendChild(paddingSpan);
        APP.translation.translateElement(
            $("#" + popupmenuElement.id + " > li > a > div"));
    };

} else {
    RemoteVideo.prototype.addRemoteVideoMenu = function() {};
}

/**
 * Removes the remote stream element corresponding to the given stream and
 * parent container.
 *
 * @param stream the stream
 * @param isVideo <tt>true</tt> if given <tt>stream</tt> is a video one.
 */
RemoteVideo.prototype.removeRemoteStreamElement =
    function (stream, isVideo, id) {
    if (!this.container)
        return false;

    var select = null;
    if (isVideo) {
        select = $('#' + id);
    }
    else
        select = $('#' + this.videoSpanId + '>audio');

    select.remove();

    console.info((isVideo ? "Video" : "Audio") +
                 " removed " + this.getResourceJid(), select);

    if (isVideo)
        this.VideoLayout.updateRemovedVideo(this.getResourceJid());
};

/**
 * Removes RemoteVideo from the page.
 */
RemoteVideo.prototype.remove = function () {
    console.log("Remove thumbnail", this.peerJid);
    this.removeConnectionIndicator();
    // Make sure that the large video is updated if are removing its
    // corresponding small video.
    this.VideoLayout.updateRemovedVideo(this.getResourceJid());
    // Remove whole container
    if (this.container.parentNode)
        this.container.parentNode.removeChild(this.container);
};

RemoteVideo.prototype.waitForPlayback = function (sel, stream) {

    var isVideo = stream.getVideoTracks().length > 0;
    if (!isVideo || stream.id === 'mixedmslabel') {
        return;
    }

    var self = this;
    var resourceJid = this.getResourceJid();

    // Register 'onplaying' listener to trigger 'videoactive' on VideoLayout
    // when video playback starts
    var onPlayingHandler = function () {
        // FIXME: why do i have to do this for FF?
        if (RTCBrowserType.isFirefox()) {
            APP.RTC.attachMediaStream(sel, stream);
        }
        if (RTCBrowserType.isTemasysPluginUsed()) {
            sel = self.selectVideoElement();
        }
        self.VideoLayout.videoactive(sel, resourceJid);
        sel[0].onplaying = null;
        if (RTCBrowserType.isTemasysPluginUsed()) {
            // 'currentTime' is used to check if the video has started
            // and the value is not set by the plugin, so we do it
            sel[0].currentTime = 1;
        }
    };
    sel[0].onplaying = onPlayingHandler;
};

RemoteVideo.prototype.addRemoteStreamElement = function (stream) {
    if (!this.container)
        return;

    var self = this;
    var isVideo = stream.getVideoTracks().length > 0;
    var streamElement = SmallVideo.createStreamElement(stream);
    var newElementId = streamElement.id;

    // Put new stream element always in front
    UIUtils.prependChild(this.container, streamElement);

    var sel = $('#' + newElementId);
    sel.hide();

    // If the container is currently visible we attach the stream.
    if (!isVideo || (this.container.offsetParent !== null && isVideo)) {
        this.waitForPlayback(sel, stream);

        APP.RTC.attachMediaStream(sel, stream);
    }

    stream.onended = function () {
        console.log('stream ended', this);

        self.removeRemoteStreamElement(stream, isVideo, newElementId);

    };

    // Add click handler.
    var onClickHandler = function (event) {

        self.VideoLayout.handleVideoThumbClicked(false, self.getResourceJid());

        // On IE we need to populate this handler on video <object>
        // and it does not give event instance as an argument,
        // so we check here for methods.
        if (event.stopPropagation && event.preventDefault) {
            event.stopPropagation();
            event.preventDefault();
        }
        return false;
    };
    this.container.onclick = onClickHandler;
    // reselect
    if (RTCBrowserType.isTemasysPluginUsed())
        sel = $('#' + newElementId);
    sel[0].onclick = onClickHandler;
},

/**
 * Show/hide peer container for the given resourceJid.
 */
RemoteVideo.prototype.showPeerContainer = function (state) {
    if (!this.container)
        return;

    var isHide = state === 'hide';
    var resizeThumbnails = false;

    if (!isHide) {
        if (!$(this.container).is(':visible')) {
            resizeThumbnails = true;
            $(this.container).show();
        }
        // Call showAvatar with undefined, so that we'll figure out if avatar
        // should be displayed based on video muted status and whether or not
        // it's in the lastN set
        this.showAvatar(undefined);
    }
    else if ($(this.container).is(':visible') && isHide)
    {
        resizeThumbnails = true;
        $(this.container).hide();
        if(this.connectionIndicator)
            this.connectionIndicator.hide();
    }

    if (resizeThumbnails) {
        this.VideoLayout.resizeThumbnails();
    }

    // We want to be able to pin a participant from the contact list, even
    // if he's not in the lastN set!
    // ContactList.setClickable(resourceJid, !isHide);

};

RemoteVideo.prototype.removeConnectionIndicator = function () {
    if (this.connectionIndicator)
        this.connectionIndicator.remove();
};

RemoteVideo.prototype.hideConnectionIndicator = function () {
    if (this.connectionIndicator)
        this.connectionIndicator.hide();
};

/**
 * Updates the remote video menu.
 *
 * @param jid the jid indicating the video for which we're adding a menu.
 * @param isMuted indicates the current mute state
 */
RemoteVideo.prototype.updateRemoteVideoMenu = function (isMuted) {
    var muteMenuItem
        = $('#remote_popupmenu_' + this.getResourceJid() + '>li>a.mutelink');

    var mutedIndicator = "<i class='icon-mic-disabled'></i>";

    if (muteMenuItem.length) {
        var muteLink = muteMenuItem.get(0);

        if (isMuted === 'true') {
            muteLink.innerHTML = mutedIndicator + ' Muted';
            muteLink.className = 'mutelink disabled';
        }
        else {
            muteLink.innerHTML = mutedIndicator + ' Mute';
            muteLink.className = 'mutelink';
        }
    }
};

/**
 * Sets the display name for the given video span id.
 */
RemoteVideo.prototype.setDisplayName = function(displayName, key) {

    if (!this.container) {
        console.warn( "Unable to set displayName - " + this.videoSpanId +
                " does not exist");
        return;
    }

    var nameSpan = $('#' + this.videoSpanId + '>span.displayname');

    // If we already have a display name for this video.
    if (nameSpan.length > 0) {
        if (displayName && displayName.length > 0) {
            $('#' + this.videoSpanId + '_name').html(displayName);
        }
        else if (key && key.length > 0) {
            var nameHtml = APP.translation.generateTranslationHTML(key);
            $('#' + this.videoSpanId + '_name').html(nameHtml);
        }
        else
            $('#' + this.videoSpanId + '_name').text(
                interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME);
    } else {
        nameSpan = document.createElement('span');
        nameSpan.className = 'displayname';
        $('#' + this.videoSpanId)[0].appendChild(nameSpan);


        if (displayName && displayName.length > 0) {
            nameSpan.innerText = displayName;
        }
        else
            nameSpan.innerText = interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME;

        nameSpan.id = this.videoSpanId + '_name';
    }
};

/**
 * Removes remote video menu element from video element identified by
 * given <tt>videoElementId</tt>.
 *
 * @param videoElementId the id of local or remote video element.
 */
RemoteVideo.prototype.removeRemoteVideoMenu = function() {
    var menuSpan = $('#' + this.videoSpanId + '>span.remotevideomenu');
    if (menuSpan.length) {
        menuSpan.remove();
    }
};

RemoteVideo.prototype.getResourceJid = function () {
    if (!this.resourceJid) {
        console.error("Undefined resource jid");
    }
    return this.resourceJid;
};

RemoteVideo.createContainer = function (spanId) {
    var container = document.createElement('span');
    container.id = spanId;
    container.className = 'videocontainer';
    var remotes = document.getElementById('remoteVideos');
    return remotes.appendChild(container);
};


module.exports = RemoteVideo;