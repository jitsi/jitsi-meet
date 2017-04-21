/* global $, APP */
/* jshint -W101 */
import UIEvents from "../../../service/UI/UIEvents";

/**
 * Store the current ring overlay instance.
 * Note: We want to have only 1 instance at a time.
 */
let overlay = null;

/**
 * Handler for UIEvents.LARGE_VIDEO_AVATAR_VISIBLE event.
 * @param {boolean} shown indicates whether the avatar on the large video is
 *  currently displayed or not.
 */
function onAvatarVisible(shown) {
    overlay._changeBackground(shown);
}

/**
 * Shows ring overlay
 */
class RingOverlay {
    /**
     *
     * @param callee The callee (Object) as defined by the JWT support.
     * @param {boolean} disableRingingSound if true the ringing sound wont be played.
     */
    constructor(callee, disableRingingSound) {
        this._containerId = 'ringOverlay';
        this._audioContainerId = 'ringOverlayRinging';
        this.isRinging = true;
        this.callee = callee;
        this.disableRingingSound = disableRingingSound;
        this.render();
        if(!disableRingingSound)
            this._initAudio();
        this._timeout = setTimeout(() => {
            this.destroy();
            this.render();
        }, 30000);
    }

    /**
     * Initializes the audio element and setups the interval for playing it.
     */
    _initAudio() {
        this.audio = document.getElementById(this._audioContainerId);
        this.audio.play();
        this._setAudioTimeout();
    }

    /**
     * Chagnes the background of the ring overlay.
     * @param {boolean} solid - if true the new background will be the solid
     * one, otherwise the background will be default one.
     * NOTE: The method just toggles solidBG css class.
     */
    _changeBackground(solid) {
        const container = $("#" + this._containerId);
        if(solid) {
            container.addClass("solidBG");
        } else {
            container.removeClass("solidBG");
        }
    }

    /**
     * Builds and appends the ring overlay to the html document
     */
    _getHtmlStr(callee) {
        let callingLabel = this.isRinging ? "<p>Calling...</p>" : "";
        let callerStateLabel =  this.isRinging ? "" : " isn't available";
        let audioHTML = this.disableRingingSound ? ""
            : "<audio id=\"" + this._audioContainerId
                + "\" src=\"./sounds/ring.ogg\" />";
        return `
            <div id="${this._containerId}" class='ringing' >
                <div class='ringing__content'>
                    ${callingLabel}
                    <img class='ringing__avatar' src="${callee.avatarUrl}" />
                    <div class="ringing__caller-info">
                        <p>${callee.name}${callerStateLabel}</p>
                    </div>
                </div>
                ${audioHTML}
            </div>`;
    }

    /**
     *
     */
    render() {
        this.htmlStr = this._getHtmlStr(this.callee);
        this._attach();
    }

    /**
     * Destroys and clears all the objects (html elements and audio interval)
     * related to the ring overlay.
     */
    destroy() {
        this.isRinging = false;
        this._stopAudio();
        this._detach();
    }

    _attach() {
        $("body").append(this.htmlStr);
    }

    _detach() {
        $(`#${this._containerId}`).remove();
    }

    /**
     * Stops the ringing and clears related timers.
     */
    _stopAudio() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        if(this._timeout) {
            clearTimeout(this._timeout);
        }
    }

    /**
     * Sets the interval that is going to play the ringing sound.
     */
    _setAudioTimeout() {
        this.interval = setInterval( () => {
            this.audio.play();
        }, 5000);
    }
}

export default {
    /**
     * Shows the ring overlay for the passed callee.
     *
     * @param {Object} callee - The callee. Object containing data about
     * callee.
     * @param {boolean} disableRingingSound - If true the ringing sound won't be
     * played.
     * @returns {void}
     */
    show(callee, disableRingingSound = false) {
        if(overlay) {
            this.hide();
        }

        overlay = new RingOverlay(callee, disableRingingSound);
        APP.UI.addListener(UIEvents.LARGE_VIDEO_AVATAR_VISIBLE,
            onAvatarVisible);
    },

    /**
     * Hides the ring overlay. Destroys all the elements related to the ring
     * overlay.
     */
    hide() {
        if(!overlay) {
            return false;
        }
        overlay.destroy();
        overlay = null;
        APP.UI.removeListener(UIEvents.LARGE_VIDEO_AVATAR_VISIBLE,
            onAvatarVisible);
        return true;
    },

    /**
     * Checks whether or not the ring overlay is currently displayed.
     *
     * @returns {boolean} true if the ring overlay is currently displayed or
     * false otherwise.
     */
    isVisible () {
        return overlay !== null;
    }
};
