var SmallVideo = require("./SmallVideo");
var ConnectionIndicator = require("./ConnectionIndicator");
var NicknameHandler = require("../util/NicknameHandler");
var UIUtil = require("../util/UIUtil");
var LargeVideo = require("./LargeVideo");

function LocalVideo(VideoLayout)
{
    this.videoSpanId = "localVideoContainer";
    this.container = $("#localVideoContainer").get(0);
    this.VideoLayout = VideoLayout;
    this.flipX = true;
    this.peerJid = null;
    this.resourceJid = null;
}

LocalVideo.prototype = Object.create(SmallVideo.prototype);
LocalVideo.prototype.constructor = LocalVideo;

/**
 * Creates the edit display name button.
 *
 * @returns the edit button
 */
function createEditDisplayNameButton() {
    var editButton = document.createElement('a');
    editButton.className = 'displayname';
    UIUtil.setTooltip(editButton,
        "videothumbnail.editnickname",
        "top");
    editButton.innerHTML = '<i class="fa fa-pencil"></i>';

    return editButton;
}


/**
 * Sets the display name for the given video span id.
 */
LocalVideo.prototype.setDisplayName = function(displayName, key) {

    if (!this.container) {
        console.warn(
                "Unable to set displayName - " + this.videoSpanId + " does not exist");
        return;
    }

    var nameSpan = $('#' + this.videoSpanId + '>span.displayname');
    var defaultLocalDisplayName = APP.translation.generateTranslatonHTML(
        interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME);

    // If we already have a display name for this video.
    if (nameSpan.length > 0) {

        if (nameSpan.text() !== displayName) {
            if (displayName && displayName.length > 0)
            {
                var meHTML = APP.translation.generateTranslatonHTML("me");
                $('#localDisplayName').html(displayName + ' (' + meHTML + ')');
            }
            else
                $('#localDisplayName').html(defaultLocalDisplayName);
        }
    } else {
        var editButton = createEditDisplayNameButton();

        nameSpan = document.createElement('span');
        nameSpan.className = 'displayname';
        $('#' + this.videoSpanId)[0].appendChild(nameSpan);


        if (displayName && displayName.length > 0) {
            var meHTML = APP.translation.generateTranslatonHTML("me");
            nameSpan.innerHTML = displayName + meHTML;
        }
        else {
            nameSpan.innerHTML = defaultLocalDisplayName;
        }


        nameSpan.id = 'localDisplayName';
        this.container.appendChild(editButton);
        //translates popover of edit button
        APP.translation.translateElement($("a.displayname"));

        var editableText = document.createElement('input');
        editableText.className = 'displayname';
        editableText.type = 'text';
        editableText.id = 'editDisplayName';

        if (displayName && displayName.length) {
            editableText.value = displayName;
        }

        var defaultNickname = APP.translation.translateString(
            "defaultNickname", {name: "Jane Pink"});
        editableText.setAttribute('style', 'display:none;');
        editableText.setAttribute('data-18n',
            '[placeholder]defaultNickname');
        editableText.setAttribute("data-i18n-options",
            JSON.stringify({name: "Jane Pink"}));
        editableText.setAttribute("placeholder", defaultNickname);

        this.container.appendChild(editableText);

        var self = this;
        $('#localVideoContainer .displayname')
            .bind("click", function (e) {

                e.preventDefault();
                e.stopPropagation();
                $('#localDisplayName').hide();
                $('#editDisplayName').show();
                $('#editDisplayName').focus();
                $('#editDisplayName').select();

                $('#editDisplayName').one("focusout", function (e) {
                    self.VideoLayout.inputDisplayNameHandler(this.value);
                });

                $('#editDisplayName').on('keydown', function (e) {
                    if (e.keyCode === 13) {
                        e.preventDefault();
                        self.VideoLayout.inputDisplayNameHandler(this.value);
                    }
                });
            });
    }
}

LocalVideo.prototype.inputDisplayNameHandler = function (name) {
    NicknameHandler.setNickname(name);

    if (!$('#localDisplayName').is(":visible")) {
        if (NicknameHandler.getNickname())
        {
            var meHTML = APP.translation.generateTranslatonHTML("me");
            $('#localDisplayName').html(NicknameHandler.getNickname() + " (" + meHTML + ")");
        }
        else
        {
            var defaultHTML = APP.translation.generateTranslatonHTML(
                interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME);
            $('#localDisplayName')
                .html(defaultHTML);
        }
        $('#localDisplayName').show();
    }

    $('#editDisplayName').hide();
}

LocalVideo.prototype.createConnectionIndicator = function()
{
    if(this.connectionIndicator)
        return;

    this.connectionIndicator
        = new ConnectionIndicator(this, null);
}

LocalVideo.prototype.changeVideo = function (stream, isMuted) {
    var self = this;

    function localVideoClick(event) {
        event.stopPropagation();
        self.VideoLayout.handleVideoThumbClicked(
            false,
            APP.xmpp.myResource());
    }

    $('#localVideoContainer').click(localVideoClick);

    // Add hover handler
    $('#localVideoContainer').hover(
        function() {
            self.showDisplayName(true);
        },
        function() {
            if (!LargeVideo.isLargeVideoVisible()
                || APP.xmpp.myResource() !== LargeVideo.getResourceJid())
                self.showDisplayName(false);
        }
    );

    if(isMuted)
    {
        APP.UI.setVideoMute(true);
        return;
    }
    this.flipX = (stream.videoType == "screen")? false : true;
    var localVideo = document.createElement('video');
    localVideo.id = 'localVideo_' +
        APP.RTC.getStreamID(stream.getOriginalStream());
    localVideo.autoplay = true;
    localVideo.volume = 0; // is it required if audio is separated ?
    localVideo.oncontextmenu = function () { return false; };

    var localVideoContainer = document.getElementById('localVideoWrapper');
    localVideoContainer.appendChild(localVideo);

    var localVideoSelector = $('#' + localVideo.id);

    // Add click handler to both video and video wrapper elements in case
    // there's no video.
    localVideoSelector.click(localVideoClick);

    if (this.flipX) {
        localVideoSelector.addClass("flipVideoX");
    }

    // Attach WebRTC stream
    APP.RTC.attachMediaStream(localVideoSelector, stream.getOriginalStream());

    // Add stream ended handler
    stream.getOriginalStream().onended = function () {
        localVideoContainer.removeChild(localVideo);
        self.VideoLayout.updateRemovedVideo(APP.xmpp.myResource());
    };
}

LocalVideo.prototype.joined = function (jid) {
    this.peerJid = jid;
    this.resourceJid = Strophe.getResourceFromJid(jid);
}

module.exports = LocalVideo;