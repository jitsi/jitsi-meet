/* global $, APP, YT, onPlayerReady, onPlayerStateChange, onPlayerError */

import messageHandler from '../util/MessageHandler';
import UIUtil from '../util/UIUtil';
import UIEvents from '../../../service/UI/UIEvents';

import VideoLayout from "../videolayout/VideoLayout";
import LargeContainer from '../videolayout/LargeContainer';
import SmallVideo from '../videolayout/SmallVideo';
import FilmStrip from '../videolayout/FilmStrip';
import ToolbarToggler from "../toolbars/ToolbarToggler";

export const SHARED_VIDEO_CONTAINER_TYPE = "sharedvideo";

/**
 * Example shared video link.
 * @type {string}
 */
const defaultSharedVideoLink = "https://www.youtube.com/watch?v=xNXN7CZk8X0";

/**
 * Manager of shared video.
 */
export default class SharedVideoManager {
    constructor (emitter) {
        this.emitter = emitter;
        this.isSharedVideoShown = false;
        this.isPlayerAPILoaded = false;
        this.updateInterval = 5000; // milliseconds
    }

    /**
     * Starts shared video by asking user for url, or if its already working
     * asks whether the user wants to stop sharing the video.
     */
    toggleSharedVideo () {
        if(!this.isSharedVideoShown) {
            requestVideoLink().then(
                    url => this.emitter.emit(
                                UIEvents.UPDATE_SHARED_VIDEO, url, 'start'),
                    err => console.error('SHARED VIDEO CANCELED', err)
            );
            return;
        }

        showStopVideoPropmpt().then(() =>
            this.emitter.emit(UIEvents.UPDATE_SHARED_VIDEO, null, 'stop'));
    }

    /**
     * Shows the player component and starts the checking function
     * that will be sending updates, if we are the one shared the video
     * @param url the video url
     * @param attributes
     */
    showSharedVideo (url, attributes) {
        if (this.isSharedVideoShown)
            return;

        // the video url
        this.url = url;

        // the owner of the video
        this.from = attributes.from;

        // This code loads the IFrame Player API code asynchronously.
        var tag = document.createElement('script');

        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        var self = this;
        if(self.isPlayerAPILoaded)
            window.onYouTubeIframeAPIReady();
        else
            window.onYouTubeIframeAPIReady = function() {
                self.isPlayerAPILoaded = true;
                let showControls = APP.conference.isLocalId(self.from) ? 1 : 0;
                self.player = new YT.Player('sharedVideoIFrame', {
                    height: '100%',
                    width: '100%',
                    videoId: self.url,
                    playerVars: {
                        'origin': location.origin,
                        'fs': '0',
                        'autoplay': 1,
                        'controls': showControls,
                        'rel' : 0
                    },
                    events: {
                        'onReady': onPlayerReady,
                        'onStateChange': onPlayerStateChange,
                        'onError': onPlayerError
                    }
                });
            };

        // whether we should pause the player as initial status
        // sometimes if we try to pause the player before it starts playing
        // we can end up with player in buffering mode
        this.initialPause = false;
        window.onPlayerStateChange = function(event) {
            if (event.data == YT.PlayerState.PLAYING) {
                self.playerPaused = false;

                // check for initial pause
                if(self.initialPause) {
                    self.initialPause = false;
                    self.player.pauseVideo();
                }
                self.updateCheck();
            } else if (event.data == YT.PlayerState.PAUSED) {
                self.playerPaused = true;
                self.updateCheck(true);
            }
        };

        window.onPlayerReady = function(event) {
            let player = event.target;
            player.playVideo();

            let thumb = new SharedVideoThumb(self.url);
            thumb.setDisplayName(player.getVideoData().title);
            VideoLayout.addParticipantContainer(self.url, thumb);

            let iframe = player.getIframe();
            self.sharedVideo = new SharedVideoContainer(
                {url, iframe, player});

            VideoLayout.addLargeVideoContainer(
                SHARED_VIDEO_CONTAINER_TYPE, self.sharedVideo);
            VideoLayout.handleVideoThumbClicked(true, self.url);

            self.isSharedVideoShown = true;

            // If we are sending the command and we are starting the player
            // we need to continuously send the player current time position
            if(APP.conference.isLocalId(self.from)) {
                self.intervalId = setInterval(
                    self.updateCheck.bind(self),
                    self.updateInterval);
            }

            // set initial state of the player if there is enough information
            if(attributes.state === 'pause')
                self.initialPause = true;
            else if(attributes.time > 0) {
                console.log("Player seekTo:", attributes.time);
                player.seekTo(attributes.time);
            }
        };

        window.onPlayerError = function(event) {
            console.error("Error in the player:" + event.data);
        };
    }

    /**
     * Checks current state of the player and fire an event with the values.
     */
    updateCheck(sendPauseEvent)
    {
        // ignore update checks if we are not the owner of the video
        if(!APP.conference.isLocalId(this.from))
            return;

        let state = this.player.getPlayerState();
        // if its paused and haven't been pause - send paused
        if (state === YT.PlayerState.PAUSED && sendPauseEvent) {
            this.emitter.emit(UIEvents.UPDATE_SHARED_VIDEO,
                this.url, 'pause');
        }
        // if its playing and it was paused - send update with time
        // if its playing and was playing just send update with time
        else if (state === YT.PlayerState.PLAYING) {
            this.emitter.emit(UIEvents.UPDATE_SHARED_VIDEO,
                this.url, 'playing',
                this.player.getCurrentTime(),
                this.player.isMuted() ? 0 : this.player.getVolume());
        }
    }

    /**
     * Updates video, if its not playing and needs starting or
     * if its playing and needs to be paysed
     * @param url the video url
     * @param attributes
     */
    updateSharedVideo (url, attributes) {
        // if we are sending the event ignore
        if(APP.conference.isLocalId(this.from)) {
            return;
        }

        if (attributes.state == 'playing') {

            if(!this.isSharedVideoShown) {
                this.showSharedVideo(url, attributes);
                return;
            }

            // ocasionally we get this.player.getCurrentTime is not a function
            // it seems its that player hasn't really loaded
            if(!this.player || !this.player.getCurrentTime
                || !this.player.pauseVideo
                || !this.player.playVideo
                || !this.player.getVolume
                || !this.player.seekTo
                || !this.player.getVolume)
                return;

            // check received time and current time
            let currentPosition = this.player.getCurrentTime();
            let diff = Math.abs(attributes.time - currentPosition);

            // if we drift more than two times of the interval for checking
            // sync, the interval is in milliseconds
            if(diff > this.updateInterval*2/1000) {
                console.log("Player seekTo:", attributes.time,
                    " current time is:", currentPosition, " diff:", diff);
                this.player.seekTo(attributes.time);
            }

            // lets check the volume
            if (attributes.volume !== undefined &&
                this.player.getVolume() != attributes.volume) {
                this.player.setVolume(attributes.volume);
                console.log("Player change of volume:" + attributes.volume);
            }

            if(this.playerPaused)
                this.player.playVideo();
        } else if (attributes.state == 'pause') {
            // if its not paused, pause it
            if(this.isSharedVideoShown) {
                this.player.pauseVideo();
            }
            else {
                // if not shown show it, passing attributes so it can
                // be shown paused
                this.showSharedVideo(url, attributes);
            }
        }
    }

    /**
     * Stop shared video if it is currently showed. If the user started the
     * shared video is the one in the attributes.from (called when user
     * left and we want to remove video if the user sharing it left).
     * @param attributes
     */
    stopSharedVideo (attributes) {
        if (!this.isSharedVideoShown)
            return;

        if(this.from !== attributes.from)
            return;

        if(this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        VideoLayout.removeParticipantContainer(this.url);

        VideoLayout.showLargeVideoContainer(SHARED_VIDEO_CONTAINER_TYPE, false)
            .then(() => {
                VideoLayout.removeLargeVideoContainer(
                    SHARED_VIDEO_CONTAINER_TYPE);

                this.player.destroy();
                this.player = null;
        });

        this.url = null;
        this.isSharedVideoShown = false;
    }
}

/**
 * Container for shared video iframe.
 */
class SharedVideoContainer extends LargeContainer {

    constructor ({url, iframe, player}) {
        super();

        this.$iframe = $(iframe);
        this.url = url;
        this.player = player;
    }

    get $video () {
        return this.$iframe;
    }

    show () {
        return new Promise(resolve => {
            this.$iframe.fadeIn(300, () => {
                this.$iframe.css({opacity: 1});
                resolve();
            });
        });
    }

    hide () {
        return new Promise(resolve => {
            this.$iframe.fadeOut(300, () => {
                this.$iframe.css({opacity: 0});
                resolve();
            });
        });
    }

    onHoverIn () {
        ToolbarToggler.showToolbar();
    }

    get id () {
        return this.url;
    }

    resize (containerWidth, containerHeight) {
        let height = containerHeight - FilmStrip.getFilmStripHeight();

        let width = containerWidth;

        this.$iframe.width(width).height(height);
    }

    /**
     * @return {boolean} do not switch on dominant speaker event if on stage.
     */
    stayOnStage () {
        return false;
    }
}

function SharedVideoThumb (url)
{
    this.id = url;

    this.url = url;
    this.setVideoType(SHARED_VIDEO_CONTAINER_TYPE);
    this.videoSpanId = "sharedVideoContainer";
    this.container = this.createContainer(this.videoSpanId);
    this.container.onclick = this.videoClick.bind(this);
    this.bindHoverHandler();

    SmallVideo.call(this, VideoLayout);
    this.isVideoMuted = true;
}
SharedVideoThumb.prototype = Object.create(SmallVideo.prototype);
SharedVideoThumb.prototype.constructor = SharedVideoThumb;

/**
 * hide display name
 */

SharedVideoThumb.prototype.setDeviceAvailabilityIcons = function () {};

SharedVideoThumb.prototype.avatarChanged = function () {};

SharedVideoThumb.prototype.createContainer = function (spanId) {
    var container = document.createElement('span');
    container.id = spanId;
    container.className = 'videocontainer';

    // add the avatar
    var avatar = document.createElement('img');
    avatar.id = 'avatar_' + this.id;
    avatar.className = 'sharedVideoAvatar';
    avatar.src = "https://img.youtube.com/vi/" + this.url + "/0.jpg";
    container.appendChild(avatar);

    var remotes = document.getElementById('remoteVideos');
    return remotes.appendChild(container);
};

/**
 * The thumb click handler.
 */
SharedVideoThumb.prototype.videoClick = function () {
    VideoLayout.handleVideoThumbClicked(true, this.url);
};

/**
 * Removes RemoteVideo from the page.
 */
SharedVideoThumb.prototype.remove = function () {
    console.log("Remove shared video thumb", this.id);

    // Make sure that the large video is updated if are removing its
    // corresponding small video.
    this.VideoLayout.updateRemovedVideo(this.id);

    // Remove whole container
    if (this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
    }
};

/**
 * Sets the display name for the thumb.
 */
SharedVideoThumb.prototype.setDisplayName = function(displayName) {
    if (!this.container) {
        console.warn( "Unable to set displayName - " + this.videoSpanId +
            " does not exist");
        return;
    }

    var nameSpan = $('#' + this.videoSpanId + '>span.displayname');

    // If we already have a display name for this video.
    if (nameSpan.length > 0) {
        if (displayName && displayName.length > 0) {
            $('#' + this.videoSpanId + '_name').text(displayName);
        }
    } else {
        nameSpan = document.createElement('span');
        nameSpan.className = 'displayname';
        $('#' + this.videoSpanId)[0].appendChild(nameSpan);

        if (displayName && displayName.length > 0)
            $(nameSpan).text(displayName);
        nameSpan.id = this.videoSpanId + '_name';
    }

};

/**
 * Checks if given string is youtube url.
 * @param {string} url string to check.
 * @returns {boolean}
 */
function getYoutubeLink(url) {
    let p = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;//jshint ignore:line
    return (url.match(p)) ? RegExp.$1 : false;
}

/**
 * Ask user if he want to close shared video.
 */
function showStopVideoPropmpt() {
    return new Promise(function (resolve, reject) {
        messageHandler.openTwoButtonDialog(
            "dialog.removeSharedVideoTitle",
            null,
            "dialog.removeSharedVideoMsg",
            null,
            false,
            "dialog.Remove",
            function(e,v,m,f) {
                if (v) {
                    resolve();
                } else {
                    reject();
                }
            }
        );

    });
}

/**
 * Ask user for shared video url to share with others.
 * Dialog validates client input to allow only youtube urls.
 */
function requestVideoLink() {
    let i18n = APP.translation;
    const title = i18n.generateTranslationHTML("dialog.shareVideoTitle");
    const cancelButton = i18n.generateTranslationHTML("dialog.Cancel");
    const shareButton = i18n.generateTranslationHTML("dialog.Share");
    const backButton = i18n.generateTranslationHTML("dialog.Back");
    const linkError
        = i18n.generateTranslationHTML("dialog.shareVideoLinkError");
    const i18nOptions = {url: defaultSharedVideoLink};
    const defaultUrl = i18n.translateString("defaultLink", i18nOptions);

    return new Promise(function (resolve, reject) {
        let dialog = messageHandler.openDialogWithStates({
            state0: {
                html:  `
                    <h2>${title}</h2>
                    <input name="sharedVideoUrl" type="text"
                           data-i18n="[placeholder]defaultLink"
                           data-i18n-options="${JSON.stringify(i18nOptions)}"
                           placeholder="${defaultUrl}"
                           autofocus>`,
                persistent: false,
                buttons: [
                    {title: cancelButton, value: false},
                    {title: shareButton, value: true}
                ],
                focus: ':input:first',
                defaultButton: 1,
                submit: function (e, v, m, f) {
                    e.preventDefault();
                    if (!v) {
                        reject('cancelled');
                        dialog.close();
                        return;
                    }

                    let sharedVideoUrl = f.sharedVideoUrl;
                    if (!sharedVideoUrl) {
                        return;
                    }

                    let urlValue = encodeURI(UIUtil.escapeHtml(sharedVideoUrl));
                    let yVideoId = getYoutubeLink(urlValue);
                    if (!yVideoId) {
                        dialog.goToState('state1');
                        return false;
                    }

                    resolve(yVideoId);
                    dialog.close();
                }
            },

            state1: {
                html: `<h2>${title}</h2> ${linkError}`,
                persistent: false,
                buttons: [
                    {title: cancelButton, value: false},
                    {title: backButton, value: true}
                ],
                focus: ':input:first',
                defaultButton: 1,
                submit: function (e, v, m, f) {
                    e.preventDefault();
                    if (v === 0) {
                        reject();
                        dialog.close();
                    } else {
                        dialog.goToState('state0');
                    }
                }
            }
        });

    });
}

