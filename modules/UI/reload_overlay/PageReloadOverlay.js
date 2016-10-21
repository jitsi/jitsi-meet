/* global $, APP, AJS */

import Overlay from '../overlay/Overlay';

/**
 * An overlay dialog which is shown before the conference is reloaded. Shows
 * a warning message and counts down towards the reload.
 */
class PageReloadOverlayImpl extends Overlay{
    /**
     * Creates new <tt>PageReloadOverlayImpl</tt>
     * @param {number} timeoutSeconds how long the overlay dialog will be
     * displayed, before the conference will be reloaded.
     */
    constructor(timeoutSeconds) {
        super();
        /**
         * Conference reload counter in seconds.
         * @type {number}
         */
        this.timeLeft = timeoutSeconds;
        /**
         * Conference reload timeout in seconds.
         * @type {number}
         */
        this.timeout = timeoutSeconds;
    }
    /**
     * Constructs overlay body with the warning message and count down towards
     * the conference reload.
     * @override
     */
    _buildOverlayContent() {
        return `
            <span data-i18n='dialog.serviceUnavailable' 
                  class='overlay_text_small'></span>
            <span data-i18n='dialog.conferenceReloadMsg' 
                  class='overlay_text_small'></span>
            <div>
                <div id='reloadProgressBar' class="aui-progress-indicator">
                    <span class="aui-progress-indicator-value"></span>
                </div>
                <span id='reloadSecRemaining' class='overlay_text_small'>
                </span>
            </div>`;
    }

    /**
     * Updates the progress indicator position and the label with the time left.
     */
    updateDisplay() {

        const timeLeftTxt
            = APP.translation.translateString(
                "dialog.conferenceReloadTimeLeft",
                { seconds: this.timeLeft });
        $("#reloadSecRemaining").text(timeLeftTxt);

        const ratio = (this.timeout - this.timeLeft) / this.timeout;
        AJS.progressBars.update("#reloadProgressBar", ratio);
    }

    /**
     * Starts the reload countdown with the animation.
     * @override
     */
    _onShow() {

        // Initialize displays
        this.updateDisplay();

        var intervalId = window.setInterval(function() {

            if (this.timeLeft >= 1) {
                this.timeLeft -= 1;
            }

            this.updateDisplay();

            if (this.timeLeft === 0) {
                window.clearInterval(intervalId);
                APP.ConferenceUrl.reload();
            }
        }.bind(this), 1000);

        console.info(
            "The conference will be reloaded after "
                + this.timeLeft + " seconds.");
    }
}

/**
 * Holds the page reload overlay instance.
 *
 * {@type PageReloadOverlayImpl}
 */
let overlay;

export default {
    /**
     * Checks whether the page reload overlay has been displayed.
     * @return {boolean} <tt>true</tt> if the page reload overlay is currently
     * visible or <tt>false</tt> otherwise.
     */
    isVisible() {
        return overlay && overlay.isVisible();
    },
    /**
     * Shows the page reload overlay which will do the conference reload after
     * the given amount of time.
     *
     * @param {number} timeoutSeconds how many seconds before the conference
     * reload will happen.
     */
    show(timeoutSeconds) {

        if (!overlay) {
            overlay = new PageReloadOverlayImpl(timeoutSeconds);
        }
        overlay.show();
    }
};
