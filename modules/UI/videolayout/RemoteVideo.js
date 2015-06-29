var ConnectionIndicator = require("./ConnectionIndicator");
var SmallVideo = require("./SmallVideo");
var AudioLevels = require("../audio_levels/AudioLevels");
var LargeVideo = require("./LargeVideo");
var Avatar = require("../avatar/Avatar");

function RemoteVideo(peerJid, VideoLayout)
{
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
    this.flipX = false;
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
    popupmenuElement.id
        = 'remote_popupmenu_' + this.resourceJid;
    spanElement.appendChild(popupmenuElement);

    var muteMenuItem = document.createElement('li');
    var muteLinkItem = document.createElement('a');

    var mutedIndicator = "<i style='float:left;' class='icon-mic-disabled'></i>";

    if (!this.isMuted) {
        muteLinkItem.innerHTML = mutedIndicator +
            " <div style='width: 90px;margin-left: 20px;' data-i18n='videothumbnail.domute'></div>";
        muteLinkItem.className = 'mutelink';
    }
    else {
        muteLinkItem.innerHTML = mutedIndicator +
            " <div style='width: 90px;margin-left: 20px;' data-i18n='videothumbnail.muted'></div>";
        muteLinkItem.className = 'mutelink disabled';
    }

    var self = this;
    muteLinkItem.onclick = function(){
        if ($(this).attr('disabled') != undefined) {
            event.preventDefault();
        }
        var isMute = self.isMuted == true;
        APP.xmpp.setMute(self.peerJid, !isMute);

        popupmenuElement.setAttribute('style', 'display:none;');

        if (isMute) {
            this.innerHTML = mutedIndicator +
                " <div style='width: 90px;margin-left: 20px;' data-i18n='videothumbnail.muted'></div>";
            this.className = 'mutelink disabled';
        }
        else {
            this.innerHTML = mutedIndicator +
                " <div style='width: 90px;margin-left: 20px;' data-i18n='videothumbnail.domute'></div>";
            this.className = 'mutelink';
        }
    };

    muteMenuItem.appendChild(muteLinkItem);
    popupmenuElement.appendChild(muteMenuItem);

    var ejectIndicator = "<i style='float:left;' class='fa fa-eject'></i>";

    var ejectMenuItem = document.createElement('li');
    var ejectLinkItem = document.createElement('a');
    var ejectText = "<div style='width: 90px;margin-left: 20px;' data-i18n='videothumbnail.kick'>&nbsp;</div>";
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
    APP.translation.translateElement($("#" + popupmenuElement.id + " > li > a > div"));
}


/**
 * Removes the remote stream element corresponding to the given stream and
 * parent container.
 *
 * @param stream the stream
 * @param isVideo <tt>true</tt> if given <tt>stream</tt> is a video one.
 * @param container
 */
RemoteVideo.prototype.removeRemoteStreamElement = function (stream, isVideo, id) {
    if (!this.container)
        return false;

    var select = null;
    if (isVideo) {
        select = $('#' + id);
    }
    else
        select = $('#' + this.videoSpanId + '>audio');


    // Mark video as removed to cancel waiting loop(if video is removed
    // before has started)
    select.removed = true;
    select.remove();

    var audioCount = $('#' + this.videoSpanId + '>audio').length;
    var videoCount = $('#' + this.videoSpanId + '>video').length;

    if (!audioCount && !videoCount) {
        console.log("Remove whole user", this.videoSpanId);
        if(this.connectionIndicator)
            this.connectionIndicator.remove();
        // Remove whole container
        this.container.remove();

        this.VideoLayout.resizeThumbnails();
    }

    if (isVideo)
        this.VideoLayout.updateRemovedVideo(this.resourceJid);
};

RemoteVideo.prototype.addRemoteStreamElement = function (sid, stream, thessrc) {
    var isVideo = stream.getVideoTracks().length > 0;
    if(!this.container)
        return;

    var streamElement = SmallVideo.createStreamElement(sid, stream);
    var newElementId = streamElement.id;

    this.container.appendChild(streamElement);

    var sel = $('#' + newElementId);
    sel.hide();

    // If the container is currently visible we attach the stream.
    if (!isVideo
        || (this.container.offsetParent !== null && isVideo)) {
        APP.RTC.attachMediaStream(sel, stream);

        if (isVideo)
            this.waitForRemoteVideo(sel, thessrc, stream);
    }

    var self = this;
    stream.onended = function () {
        console.log('stream ended', this);

        self.removeRemoteStreamElement(stream, isVideo, newElementId);

    };

    // Add click handler.
    this.container.onclick = function (event) {
        /*
         * FIXME It turns out that videoThumb may not exist (if there is
         * no actual video).
         */
        var videoThumb = $('#' + self.videoSpanId + '>video').get(0);
        if (videoThumb) {
            self.VideoLayout.handleVideoThumbClicked(
                false,
                self.resourceJid);
        }

        event.stopPropagation();
        event.preventDefault();
        return false;
    };

    //FIXME
    // Add hover handler
    $(this.container).hover(
        function() {
            self.showDisplayName(true);
        },
        function() {
            var videoSrc = null;
            if ($('#' + self.videoSpanId + '>video')
                && $('#' + self.videoSpanId + '>video').length > 0) {
                videoSrc = APP.RTC.getVideoSrc($('#' + self.videoSpanId + '>video').get(0));
            }

            // If the video has been "pinned" by the user we want to
            // keep the display name on place.
            if (!LargeVideo.isLargeVideoVisible()
                || videoSrc !== APP.RTC.getVideoSrc($('#largeVideo')[0]))
                self.showDisplayName(false);
        }
    );
}


RemoteVideo.prototype.waitForRemoteVideo = function(selector, ssrc, stream) {
    if (selector.removed || !selector.parent().is(":visible")) {
        console.warn("Media removed before had started", selector);
        return;
    }

    if (stream.id === 'mixedmslabel') return;

    if (selector[0].currentTime > 0) {
        APP.RTC.attachMediaStream(selector, stream); // FIXME: why do i have to do this for FF?
        this.VideoLayout.videoactive(selector, this.resourceJid);
    } else {
        var self = this;
        setTimeout(function () {
            self.waitForRemoteVideo(selector, ssrc, stream);
        }, 250);
    }
}

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

        this.showAvatar(state !== 'show');
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
    if(this.connectionIndicator)
        this.connectionIndicator.remove();
}

RemoteVideo.prototype.hideConnectionIndicator = function () {
    if(this.connectionIndicator)
        this.connectionIndicator.hide();
}

/**
 * Updates the remote video menu.
 *
 * @param jid the jid indicating the video for which we're adding a menu.
 * @param isMuted indicates the current mute state
 */
RemoteVideo.prototype.updateRemoteVideoMenu = function (isMuted) {
    var muteMenuItem
        = $('#remote_popupmenu_'
        + this.resourceJid
        + '>li>a.mutelink');

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
}

/**
 * Sets the display name for the given video span id.
 */
RemoteVideo.prototype.setDisplayName = function(displayName, key) {

    if (!this.container) {
        console.warn(
                "Unable to set displayName - " + this.videoSpanId + " does not exist");
        return;
    }

    var nameSpan = $('#' + this.videoSpanId + '>span.displayname');

    // If we already have a display name for this video.
    if (nameSpan.length > 0) {
        if (displayName && displayName.length > 0)
        {
            $('#' + this.videoSpanId + '_name').html(displayName);
        }
        else if (key && key.length > 0)
        {
            var nameHtml = APP.translation.generateTranslatonHTML(key);
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
}

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
}

RemoteVideo.createContainer = function (spanId) {
    var container = document.createElement('span');
    container.id = spanId;
    container.className = 'videocontainer';
    var remotes = document.getElementById('remoteVideos');
    return remotes.appendChild(container);
};


module.exports = RemoteVideo;