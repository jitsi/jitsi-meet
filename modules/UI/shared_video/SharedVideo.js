/* global $, APP, YT, onPlayerReady, onPlayerStateChange, onPlayerError,
JitsiMeetJS */
const logger = require("jitsi-meet-logger").getLogger(__filename);

import UIUtil from '../util/UIUtil';
import UIEvents from '../../../service/UI/UIEvents';

import VideoLayout from "../videolayout/VideoLayout";
import LargeContainer from '../videolayout/LargeContainer';
import SmallVideo from '../videolayout/SmallVideo';
import Filmstrip from '../videolayout/Filmstrip';

import { dockToolbox, showToolbox } from '../../../react/features/toolbox';

export const SHARED_VIDEO_CONTAINER_TYPE = "sharedvideo";

/**
 * Example shared video link.
 * @type {string}
 */
const defaultSharedVideoLink = "https://www.youtube.com/watch?v=xNXN7CZk8X0";
const updateInterval = 5000; // milliseconds

/**
 * The dialog for user input (video link).
 * @type {null}
 */
let dialog = null;

/**
 * Manager of shared video.
 */
export default class SharedVideoManager {
    constructor (emitter) {
        this.emitter = emitter;
        this.isSharedVideoShown = false;
        this.isPlayerAPILoaded = false;
        this.mutedWithUserInteraction = false;
    }

    /**
     * Indicates if the player volume is currently on. This will return true if
     * we have an available player, which is currently in a PLAYING state,
     * which isn't muted and has it's volume greater than 0.
     *
     * @returns {boolean} indicating if the volume of the shared video is
     * currently on.
     */
    isSharedVideoVolumeOn() {
        return (this.player
                && this.player.getPlayerState() === YT.PlayerState.PLAYING
                && !this.player.isMuted()
                && this.player.getVolume() > 0);
    }

    /**
     * Indicates if the local user is the owner of the shared video.
     * @returns {*|boolean}
     */
    isSharedVideoOwner() {
        return this.from && APP.conference.isLocalId(this.from);
    }

    /**
     * Starts shared video by asking user for url, or if its already working
     * asks whether the user wants to stop sharing the video.
     */
    toggleSharedVideo () {
        if (dialog)
            return;

        if(!this.isSharedVideoShown) {
            requestVideoLink().then(
                    url => {
                        this.emitter.emit(
                            UIEvents.UPDATE_SHARED_VIDEO, url, 'start');
                        JitsiMeetJS.analytics.sendEvent('sharedvideo.started');
                    },
                    err => {
                        logger.log('SHARED VIDEO CANCELED', err);
                        JitsiMeetJS.analytics.sendEvent('sharedvideo.canceled');
                    }
            );
            return;
        }

        if(APP.conference.isLocalId(this.from)) {
            showStopVideoPropmpt().then(() => {
                    // make sure we stop updates for playing before we send stop
                    // if we stop it after receiving self presence, we can end
                    // up sending stop playing, and on the other end it will not
                    // stop
                    if(this.intervalId) {
                         clearInterval(this.intervalId);
                         this.intervalId = null;
                    }
                    this.emitter.emit(
                        UIEvents.UPDATE_SHARED_VIDEO, this.url, 'stop');
                    JitsiMeetJS.analytics.sendEvent('sharedvideo.stoped');
                },
                () => {});
        } else {
            dialog = APP.UI.messageHandler.openMessageDialog(
                "dialog.shareVideoTitle",
                "dialog.alreadySharedVideoMsg",
                null,
                function () {
                    dialog = null;
                }
            );
            JitsiMeetJS.analytics.sendEvent('sharedvideo.alreadyshared');
        }
    }

    /**
     * Shows the player component and starts the process that will be sending
     * updates, if we are the one shared the video.
     *
     * @param id the id of the sender of the command
     * @param url the video url
     * @param attributes
     */
    onSharedVideoStart (id, url, attributes) {
        if (this.isSharedVideoShown)
            return;

        this.isSharedVideoShown = true;

        // the video url
        this.url = url;

        // the owner of the video
        this.from = id;

        this.mutedWithUserInteraction = APP.conference.isLocalAudioMuted();

        //listen for local audio mute events
        this.localAudioMutedListener = this.onLocalAudioMuted.bind(this);
        this.emitter.on(UIEvents.AUDIO_MUTED, this.localAudioMutedListener);

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
                let p = new YT.Player('sharedVideoIFrame', {
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

                // add listener for volume changes
                p.addEventListener(
                    "onVolumeChange", "onVolumeChange");

                if (APP.conference.isLocalId(self.from)){
                    // adds progress listener that will be firing events
                    // while we are paused and we change the progress of the
                    // video (seeking forward or backward on the video)
                    p.addEventListener(
                        "onVideoProgress", "onVideoProgress");
                }
            };

        /**
         * Indicates that a change in state has occurred for the shared video.
         * @param event the event notifying us of the change
         */
        window.onPlayerStateChange = function(event) {
            if (event.data == YT.PlayerState.PLAYING) {

                self.player = event.target;

                if(self.initialAttributes)
                {
                    // If a network update has occurred already now is the
                    // time to process it.
                    self.processVideoUpdate(
                        self.player,
                        self.initialAttributes);

                    self.initialAttributes = null;
                }
                self.smartAudioMute();
            } else if (event.data == YT.PlayerState.PAUSED) {
                self.smartAudioUnmute();
                JitsiMeetJS.analytics.sendEvent('sharedvideo.paused');
            }
            self.fireSharedVideoEvent(event.data == YT.PlayerState.PAUSED);
        };

        /**
         * Track player progress while paused.
         * @param event
         */
        window.onVideoProgress = function (event) {
            let state = event.target.getPlayerState();
            if (state == YT.PlayerState.PAUSED) {
                self.fireSharedVideoEvent(true);
            }
        };

        /**
         * Gets notified for volume state changed.
         * @param event
         */
        window.onVolumeChange = function (event) {
            self.fireSharedVideoEvent();

            // let's check, if player is not muted lets mute locally
            if(event.data.volume > 0 && !event.data.muted) {
                self.smartAudioMute();
            }
            else if (event.data.volume <=0 || event.data.muted) {
                self.smartAudioUnmute();
            }
            JitsiMeetJS.analytics.sendEvent('sharedvideo.volumechanged');
        };

        window.onPlayerReady = function(event) {
            let player = event.target;
            // do not relay on autoplay as it is not sending all of the events
            // in onPlayerStateChange
            player.playVideo();

            let thumb = new SharedVideoThumb(self.url);
            thumb.setDisplayName(player.getVideoData().title);
            VideoLayout.addRemoteVideoContainer(self.url, thumb);

            let iframe = player.getIframe();
            self.sharedVideo = new SharedVideoContainer(
                {url, iframe, player});

            //prevents pausing participants not sharing the video
            // to pause the video
            if (!APP.conference.isLocalId(self.from)) {
                $("#sharedVideo").css("pointer-events","none");
            }

            VideoLayout.addLargeVideoContainer(
                SHARED_VIDEO_CONTAINER_TYPE, self.sharedVideo);
            VideoLayout.handleVideoThumbClicked(self.url);

            // If we are sending the command and we are starting the player
            // we need to continuously send the player current time position
            if(APP.conference.isLocalId(self.from)) {
                self.intervalId = setInterval(
                    self.fireSharedVideoEvent.bind(self),
                    updateInterval);
            }
        };

        window.onPlayerError = function(event) {
            logger.error("Error in the player:", event.data);
            // store the error player, so we can remove it
            self.errorInPlayer = event.target;
        };
    }

    /**
     * Process attributes, whether player needs to be paused or seek.
     * @param player the player to operate over
     * @param attributes the attributes with the player state we want
     */
    processVideoUpdate (player, attributes)
    {
        if(!attributes)
            return;

        if (attributes.state == 'playing') {

            let isPlayerPaused
                = (this.player.getPlayerState() === YT.PlayerState.PAUSED);

            // If our player is currently paused force the seek.
            this.processTime(player, attributes, isPlayerPaused);

            // Process mute.
            let isAttrMuted = (attributes.muted === "true");
            if (player.isMuted() !== isAttrMuted) {
                this.smartPlayerMute(isAttrMuted, true);
            }

            // Process volume
            if (!isAttrMuted
                && attributes.volume !== undefined
                && player.getVolume() != attributes.volume) {

                player.setVolume(attributes.volume);
                logger.info("Player change of volume:" + attributes.volume);
                this.showSharedVideoMutedPopup(false);
            }

            if (isPlayerPaused)
                player.playVideo();

        } else if (attributes.state == 'pause') {
            // if its not paused, pause it
            player.pauseVideo();

            this.processTime(player, attributes, true);
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
            logger.info("Player seekTo:", attributes.time);
            player.seekTo(attributes.time);
            return;
        }

        // check received time and current time
        let currentPosition = player.getCurrentTime();
        let diff = Math.abs(attributes.time - currentPosition);

        // if we drift more than the interval for checking
        // sync, the interval is in milliseconds
        if(diff > updateInterval/1000) {
            logger.info("Player seekTo:", attributes.time,
                " current time is:", currentPosition, " diff:", diff);
            player.seekTo(attributes.time);
        }
    }

    /**
     * Checks current state of the player and fire an event with the values.
     */
    fireSharedVideoEvent(sendPauseEvent)
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
                this.player.isMuted(),
                this.player.getVolume());
        }
    }

    /**
     * Updates video, if its not playing and needs starting or
     * if its playing and needs to be paysed
     * @param id the id of the sender of the command
     * @param url the video url
     * @param attributes
     */
    onSharedVideoUpdate (id, url, attributes) {
        // if we are sending the event ignore
        if(APP.conference.isLocalId(this.from)) {
            return;
        }

        if(!this.isSharedVideoShown) {
            this.onSharedVideoStart(id, url, attributes);
            return;
        }

        if(!this.player)
            this.initialAttributes = attributes;
        else {
            this.processVideoUpdate(this.player, attributes);
        }
    }

    /**
     * Stop shared video if it is currently showed. If the user started the
     * shared video is the one in the id (called when user
     * left and we want to remove video if the user sharing it left).
     * @param id the id of the sender of the command
     */
    onSharedVideoStop (id, attributes) {
        if (!this.isSharedVideoShown)
            return;

        if(this.from !== id)
            return;

        if(!this.player) {
            // if there is no error in the player till now,
            // store the initial attributes
            if (!this.errorInPlayer) {
                this.initialAttributes = attributes;
                return;
            }
        }

        this.emitter.removeListener(UIEvents.AUDIO_MUTED,
            this.localAudioMutedListener);
        this.localAudioMutedListener = null;

        VideoLayout.removeParticipantContainer(this.url);

        VideoLayout.showLargeVideoContainer(SHARED_VIDEO_CONTAINER_TYPE, false)
            .then(() => {
                VideoLayout.removeLargeVideoContainer(
                    SHARED_VIDEO_CONTAINER_TYPE);

                if(this.player) {
                    this.player.destroy();
                    this.player = null;
                } // if there is an error in player, remove that instance
                else if (this.errorInPlayer) {
                    this.errorInPlayer.destroy();
                    this.errorInPlayer = null;
                }
                this.smartAudioUnmute();
                // revert to original behavior (prevents pausing
                // for participants not sharing the video to pause it)
                $("#sharedVideo").css("pointer-events","auto");

                this.emitter.emit(
                    UIEvents.UPDATE_SHARED_VIDEO, null, 'removed');
        });

        this.url = null;
        this.isSharedVideoShown = false;
        this.initialAttributes = null;
    }

    /**
     * Receives events for local audio mute/unmute by local user.
     * @param muted boolena whether it is muted or not.
     * @param {boolean} indicates if this mute was a result of user interaction,
     * i.e. pressing the mute button or it was programatically triggerred
     */
    onLocalAudioMuted (muted, userInteraction) {
        if(!this.player)
            return;

        if (muted) {
            this.mutedWithUserInteraction = userInteraction;
        }
        else if (this.player.getPlayerState() !== YT.PlayerState.PAUSED) {
            this.smartPlayerMute(true, false);
            // Check if we need to update other participants
            this.fireSharedVideoEvent();
        }
    }

    /**
     * Mutes / unmutes the player.
     * @param mute true to mute the shared video, false - otherwise.
     * @param {boolean} Indicates if this mute is a consequence of a network
     * video update or is called locally.
     */
    smartPlayerMute(mute, isVideoUpdate) {
        if (!this.player.isMuted() && mute) {
            this.player.mute();

            if (isVideoUpdate)
                this.smartAudioUnmute();
        }
        else if (this.player.isMuted() && !mute) {
            this.player.unMute();
            if (isVideoUpdate)
                this.smartAudioMute();
        }

        this.showSharedVideoMutedPopup(mute);
    }

    /**
     * Smart mike unmute. If the mike is currently muted and it wasn't muted
     * by the user via the mike button and the volume of the shared video is on
     * we're unmuting the mike automatically.
     */
    smartAudioUnmute() {
        if (APP.conference.isLocalAudioMuted()
            && !this.mutedWithUserInteraction
            && !this.isSharedVideoVolumeOn()) {

            this.emitter.emit(UIEvents.AUDIO_MUTED, false, false);
            this.showMicMutedPopup(false);
        }
    }

    /**
     * Smart mike mute. If the mike isn't currently muted and the shared video
     * volume is on we mute the mike.
     */
    smartAudioMute() {
        if (!APP.conference.isLocalAudioMuted()
            && this.isSharedVideoVolumeOn()) {

            this.emitter.emit(UIEvents.AUDIO_MUTED, true, false);
            this.showMicMutedPopup(true);
        }
    }

    /**
     * Shows a popup under the microphone toolbar icon that notifies the user
     * of automatic mute after a shared video has started.
     * @param show boolean, show or hide the notification
     */
    showMicMutedPopup (show) {
        if(show)
            this.showSharedVideoMutedPopup(false);

        APP.UI.showCustomToolbarPopup('#micMutedPopup', show, 5000);
    }

    /**
     * Shows a popup under the shared video toolbar icon that notifies the user
     * of automatic mute of the shared video after the user has unmuted their
     * mic.
     * @param show boolean, show or hide the notification
     */
    showSharedVideoMutedPopup (show) {
        if(show)
            this.showMicMutedPopup(false);

        APP.UI.showCustomToolbarPopup('#sharedVideoMutedPopup', show, 5000);
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

    show () {
        let self = this;
        return new Promise(resolve => {
            this.$iframe.fadeIn(300, () => {
                self.bodyBackground = document.body.style.background;
                document.body.style.background = 'black';
                this.$iframe.css({opacity: 1});
                APP.store.dispatch(dockToolbox(true));
                resolve();
            });
        });
    }

    hide () {
        let self = this;
        APP.store.dispatch(dockToolbox(false));
        return new Promise(resolve => {
            this.$iframe.fadeOut(300, () => {
                document.body.style.background = self.bodyBackground;
                this.$iframe.css({opacity: 0});
                resolve();
            });
        });
    }

    onHoverIn () {
        APP.store.dispatch(showToolbox());
    }

    get id () {
        return this.url;
    }

    resize (containerWidth, containerHeight) {
        let height = containerHeight - Filmstrip.getFilmstripHeight();

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
    avatar.className = 'sharedVideoAvatar';
    avatar.src = "https://img.youtube.com/vi/" + this.url + "/0.jpg";
    container.appendChild(avatar);

    const displayNameContainer = document.createElement('div');
    displayNameContainer.className = 'displayNameContainer';
    container.appendChild(displayNameContainer);

    var remotes = document.getElementById('filmstripRemoteVideosContainer');
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
    logger.log("Remove shared video thumb", this.id);

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
        logger.warn( "Unable to set displayName - " + this.videoSpanId +
            " does not exist");
        return;
    }

    this.updateDisplayName({
        displayName: displayName || '',
        elementID: `${this.videoSpanId}_name`,
        participantID: this.id
    });
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
        let submitFunction = function(e,v) {
            if (v) {
                resolve();
            } else {
                reject();
            }
        };

        let closeFunction = function () {
            dialog = null;
        };

        dialog = APP.UI.messageHandler.openTwoButtonDialog({
            titleKey: "dialog.removeSharedVideoTitle",
            msgKey: "dialog.removeSharedVideoMsg",
            leftButtonKey: "dialog.Remove",
            submitFunction,
            closeFunction
        });
    });
}

/**
 * Ask user for shared video url to share with others.
 * Dialog validates client input to allow only youtube urls.
 */
function requestVideoLink() {
    let i18n = APP.translation;
    const cancelButton = i18n.generateTranslationHTML("dialog.Cancel");
    const shareButton = i18n.generateTranslationHTML("dialog.Share");
    const backButton = i18n.generateTranslationHTML("dialog.Back");
    const linkError
        = i18n.generateTranslationHTML("dialog.shareVideoLinkError");

    return new Promise(function (resolve, reject) {
        dialog = APP.UI.messageHandler.openDialogWithStates({
            state0: {
                titleKey: "dialog.shareVideoTitle",
                html:  `
                    <input name="sharedVideoUrl" type="text"
                           class="input-control"
                           data-i18n="[placeholder]defaultLink"
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
                titleKey: "dialog.shareVideoTitle",
                html: linkError,
                persistent: false,
                buttons: [
                    {title: cancelButton, value: false},
                    {title: backButton, value: true}
                ],
                focus: ':input:first',
                defaultButton: 1,
                submit: function (e, v) {
                    e.preventDefault();
                    if (v === 0) {
                        reject();
                        dialog.close();
                    } else {
                        dialog.goToState('state0');
                    }
                }
            }
        }, {
            close: function () {
                dialog = null;
            }
        }, {
            url: defaultSharedVideoLink
        });
    });
}
