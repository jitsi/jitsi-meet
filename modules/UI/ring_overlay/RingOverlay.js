/* global $ */
/* jshint -W101 */

/**
 * Shows ring overlay
 */
class RingOverlay {
    /**
     * @param callee instance of User class from TokenData.js
     */
    constructor(callee) {
        this._containerId = 'ringOverlay';
        this._audioContainerId = 'ringOverlayRinging';
        this.isRinging = true;
        this.callee = callee;
        this.render();
        this.audio = document.getElementById(this._audioContainerId);
        this.audio.play();
        this._setAudioTimeout();
        this._timeout = setTimeout(() => {
            this.destroy();
            this.render();
        }, 30000);
    }

    /**
     * Builds and appends the ring overlay to the html document
     */
    _getHtmlStr(callee) {
        let callingLabel = this.isRinging? "<p>Calling...</p>" : "";
        let callerStateLabel =  this.isRinging? "" : " isn't available";
        return `
            <div id="${this._containerId}" class='ringing' >
                <div class='ringing__content'>
                    ${callingLabel}
                    <img class='ringing__avatar' src="${callee.getAvatarUrl()}" />
                    <div class="ringing__caller-info">
                        <p>${callee.getName()}${callerStateLabel}</p>
                    </div>
                </div>
                <audio id="${this._audioContainerId}" src="/sounds/ring.ogg" />
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
        this._stopAudio();
        this._detach();
    }

    _attach() {
        $("body").append(this.htmlStr);
    }

    _detach() {
        $(`#${this._containerId}`).remove();
    }

    _stopAudio() {
        this.isRinging = false;
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

/**
 * Store the current ring overlay instance.
 * Note: We want to have only 1 instance at a time.
 */
let overlay = null;

export default {
    /**
     * Shows the ring overlay for the passed callee.
     * @param callee {class User} the callee. Instance of User class from
     * TokenData.js
     */
    show(callee) {
        if(overlay) {
            this.hide();
        }

        overlay = new RingOverlay(callee);
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
