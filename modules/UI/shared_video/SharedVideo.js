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
const updateInterval = 5000; // milliseconds
/**
 * Manager of shared video.
 */
export default class SharedVideoManager {
    constructor (emitter) {
        this.emitter = emitter;
        this.isSharedVideoShown = false;
        this.isPlayerAPILoaded = false;
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

        if(APP.conference.isLocalId(this.from)) {
            showStopVideoPropmpt().then(() =>
                this.emitter.emit(
                    UIEvents.UPDATE_SHARED_VIDEO, this.url, 'stop'));
        } else {
            messageHandler.openMessageDialog(
                "dialog.shareVideoTitle",
                "dialog.alreadySharedVideoMsg"
            );
        }
    }

    /**
     * Shows the player component and starts the checking function
     * that will be sending updates, if we are the one shared the video
     * @param id the id of the sender of the command
     * @param url the video url
     * @param attributes
     */
    showSharedVideo (id, url, attributes) {
        if (this.isSharedVideoShown)
            return;

        this.isSharedVideoShown = true;

        // the video url
        this.url = url;

        // the owner of the video
        this.from = id;

        // This code loads the IFrame Player API code asynchronously.
        var tag = document.createElement('script');

        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // sometimes we receive errors like player not defined
        // or player.pauseVideo is not a function
        // we need to operate with player after start playing
        // self.player will be defined once it start playing
        // and will process any initial attributes if any
        this.initialAttributes = attributes;

        var self = this;
        if(self.isPlayerAPILoaded)
            window.onYouTubeIframeAPIReady();
        else
            window.onYouTubeIframeAPIReady = function() {
                self.isPlayerAPILoaded = true;
                let showControls = APP.conference.isLocalId(self.from) ? 1 : 0;
                new YT.Player('sharedVideoIFrame', {
                    height: '100%',
                    width: '100%',
                    videoId: self.url,
                    playerVars: {
                        'origin': location.origin,
                        'fs': '0',
                        'autoplay': 0,
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

        window.onPlayerStateChange = function(event) {
            if (event.data == YT.PlayerState.PLAYING) {
                self.playerPaused = false;

                self.player = event.target;

                if(self.initialAttributes)
                {
                    self.processAttributes(
                        self.player, self.initialAttributes, self.playerPaused);
                    self.initialAttributes = null;
                }

                self.updateCheck();
            } else if (event.data == YT.PlayerState.PAUSED) {
                self.playerPaused = true;
                self.updateCheck(true);
            }
        };

        window.onPlayerReady = function(event) {
            let player = event.target;
            // do not relay on autoplay as it is not sending all of the events
            // in onPlayerStateChange
            player.playVideo();

            let thumb = new SharedVideoThumb(self.url);
            thumb.setDisplayName(player.getVideoData().title);
            VideoLayout.addParticipantContainer(self.url, thumb);

            let iframe = player.getIframe();
            self.sharedVideo = new SharedVideoContainer(
                {url, iframe, player});

            VideoLayout.addLargeVideoContainer(
                SHARED_VIDEO_CONTAINER_TYPE, self.sharedVideo);
            VideoLayout.handleVideoThumbClicked(self.url);

            // If we are sending the command and we are starting the player
            // we need to continuously send the player current time position
            if(APP.conference.isLocalId(self.from)) {
                self.intervalId = setInterval(
                    self.updateCheck.bind(self),
                    updateInterval);
            }
        };

        window.onPlayerError = function(event) {
            console.error("Error in the player:", event.data);
            // store the error player, so we can remove it
            self.errorInPlayer = event.target;
        };
    }

    /**
     * Process attributes, whether player needs to be paused or seek.
     * @param player the player to operate over
     * @param attributes the attributes with the player state we want
     * @param playerPaused current saved state for the player
     */
    processAttributes (player, attributes, playerPaused)
    {
        if(!attributes)
            return;

        if (attributes.state == 'playing') {

            this.processTime(player, attributes, playerPaused);

            // lets check the volume
            if (attributes.volume !== undefined &&
                player.getVolume() != attributes.volume) {
                player.setVolume(attributes.volume);
                console.info("Player change of volume:" + attributes.volume);
            }

            if(playerPaused)
                player.playVideo();

        } else if (attributes.state == 'pause') {
            // if its not paused, pause it
            player.pauseVideo();

            this.processTime(player, attributes, !playerPaused);
        } else if (attributes.state == 'stop') {
            this.stopSharedVideo(this.from);
        }
    }

    /**
     * Check for time in attributes and if needed seek in current player
     * @param player the player to operate over
     * @param attributes the attributes with the player state we want
     * @param forceSeek whether seek should be forced
     */
    processTime (player, attributes, forceSeek)
    {
        if(forceSeek) {
            player.seekTo(attributes.time);
            return;
        }

        // check received time and current time
        let currentPosition = player.getCurrentTime();
        let diff = Math.abs(attributes.time - currentPosition);

        // if we drift more than the interval for checking
        // sync, the interval is in milliseconds
        if(diff > updateInterval/1000) {
            console.info("Player seekTo:", attributes.time,
                " current time is:", currentPosition, " diff:", diff);
            player.seekTo(attributes.time);
        }
    }

    /**
     * Checks current state of the player and fire an event with the values.
     */
    updateCheck(sendPauseEvent)
    {
        // ignore update checks if we are not the owner of the video
        // or there is still no player defined or we are stopped
        // (in a process of stopping)
        if(!APP.conference.isLocalId(this.from) || !this.player
            || !this.isSharedVideoShown)
            return;

        let state = this.player.getPlayerState();
        // if its paused and haven't been pause - send paused
        if (state === YT.PlayerState.PAUSED && sendPauseEvent) {
            this.emitter.emit(UIEvents.UPDATE_SHARED_VIDEO,
                this.url, 'pause', this.player.getCurrentTime());
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
     * @param id the id of the sender of the command
     * @param url the video url
     * @param attributes
     */
    updateSharedVideo (id, url, attributes) {
        // if we are sending the event ignore
        if(APP.conference.isLocalId(this.from)) {
            return;
        }

        if(!this.isSharedVideoShown) {
            this.showSharedVideo(id, url, attributes);
            return;
        }

        if(!this.player)
            this.initialAttributes = attributes;
        else {
            this.processAttributes(this.player, attributes, this.playerPaused);
        }
    }

    /**
     * Stop shared video if it is currently showed. If the user started the
     * shared video is the one in the id (called when user
     * left and we want to remove video if the user sharing it left).
     * @param id the id of the sender of the command
     */
    stopSharedVideo (id, attributes) {
        if (!this.isSharedVideoShown)
            return;

        if(this.from !== id)
            return;

        if(!this.player){
            // if there is no error in the player till now,
            // store the initial attributes
            if (!this.errorInPlayer) {
                this.initialAttributes = attributes;
                return;
            }
        }

        if(this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        VideoLayout.removeParticipantContainer(this.url);

        VideoLayout.showLargeVideoContainer(SHARED_VIDEO_CONTAINER_TYPE, false)
            .then(() => {
                VideoLayout.removeLargeVideoContainer(
                    SHARED_VIDEO_CONTAINER_TYPE);

                if(this.player) {
                    this.player.destroy();
                    this.player = null;
                }//
                else if (this.errorInPlayer) {
                    this.errorInPlayer.destroy();
                    this.errorInPlayer = null;
                }
        });

        this.url = null;
        this.isSharedVideoShown = false;
        this.initialAttributes = null;
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
        let self = this;
        return new Promise(resolve => {
            this.$iframe.fadeIn(300, () => {
                self.bodyBackground = document.body.style.background;
                document.body.style.background = 'black';
                this.$iframe.css({opacity: 1});
                ToolbarToggler.dockToolbar(true);
                resolve();
            });
        });
    }

    hide () {
        let self = this;
        ToolbarToggler.dockToolbar(false);
        return new Promise(resolve => {
            this.$iframe.fadeOut(300, () => {
                document.body.style.background = self.bodyBackground;
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
    VideoLayout.handleVideoThumbClicked(this.url);
};

/**
 * Removes RemoteVideo from the page.
 */
SharedVideoThumb.prototype.remove = function () {
    console.log("Remove shared video thumb", this.id);

    // Make sure that the large video is updated if are removing its
    // corresponding small video.
    this.VideoLayout.updateAfterThumbRemoved(this.id);

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

