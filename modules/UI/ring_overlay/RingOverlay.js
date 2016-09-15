/* global $ */

/**
 * Shows ring overlay
 */
class RingOverlay {
    /**
     * @param callee instance of User class from TokenData.js
     */
    constructor(callee) {
        this.callee = callee;
        this._buildHtml();
        this.audio = $("#ring_overlay_ringing");
        this.audio[0].play();
        this._setAudioTimeout();
    }

    /**
     * Builds and appends the ring overlay to the html document
     */
    _buildHtml() {
        $("body").append("<div class='overlay_container' >" +
        "<div class='overlay' /><div class='overlay_content'>" +
        "<img class='overlay_avatar' src='" +
        this.callee.getAvatarUrl() + "' />" +
        "<span data-i18n='calling' data-i18n-options='" +
        JSON.stringify({name: this.callee.getName()}) +
        "' class='overlay_text'>Calling " +
        this.callee.getName() + "...</span></div>" +
        "<audio id='ring_overlay_ringing' src='/sounds/ring.ogg' /></div>");
    }

    /**
     * Sets the interval that is going to play the ringing sound.
     */
    _setAudioTimeout() {
        this.interval = setInterval( () => {
            this.audio[0].play();
        }, 5000);
    }

    /**
     * Destroys and clears all the objects (html elements and audio interval)
     * related to the ring overlay.
     */
    destroy() {
        if(this.interval)
            clearInterval(this.interval);
        $(".overlay_container").remove();
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
        if(!overlay)
            return false;
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
    isDisplayed () {
        return overlay !== null;
    }
};
