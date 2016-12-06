/* global $, APP, AJS */
const logger = require("jitsi-meet-logger").getLogger(__filename);

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
     * @param {boolean} isDisconnect indicates if this reload screen is created
     * to indicate a disconnect
     * @param {boolean} isNetworkFailure <tt>true</tt> indicates that it's
     * caused by network related failure or <tt>false</tt> when it's
     * the infrastructure.
     */
    constructor(timeoutSeconds, isNetworkFailure) {
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

        /**
         * Indicates that a network related failure is the reason for the
         * reload.
         * @type {boolean}
         */
        this.isNetworkFailure = isNetworkFailure;
    }
    /**
     * Constructs overlay body with the warning message and count down towards
     * the conference reload.
     * @override
     */
    _buildOverlayContent() {
        let title = (this.isNetworkFailure)
                        ? "dialog.conferenceDisconnectTitle"
                        : "dialog.conferenceReloadTitle";
        let message = (this.isNetworkFailure)
                        ? "dialog.conferenceDisconnectMsg"
                        : "dialog.conferenceReloadMsg";

        let button = (this.isNetworkFailure)
                    ? `<button id="reconnectNow" data-i18n="dialog.reconnectNow"
                    class="button-control button-control_primary
                            button-control_center"></button>`
                    : "";

        $(document).on('click', '#reconnectNow', () => {
            APP.ConferenceUrl.reload();
        });

        return `<div class="inlay">
                    <span data-i18n=${title}
                          class='reload_overlay_title'></span>
                    <span data-i18n=${message}
                          class='reload_overlay_msg'></span>
                    <div>
                        <div id='reloadProgressBar'
                            class="aui-progress-indicator">
                            <span class="aui-progress-indicator-value"></span>
                        </div>
                        <span id='reloadSecRemaining'
                              data-i18n="dialog.conferenceReloadTimeLeft"
                            class='reload_overlay_msg'>
                        </span>
                    </div>
                    ${button}
                </div>`;
    }

    /**
     * Updates the progress indicator position and the label with the time left.
     */
    updateDisplay() {

        APP.translation.translateElement(
            $("#reloadSecRemaining"), { seconds: this.timeLeft });

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

        logger.info(
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
     * @param {boolean} isNetworkFailure <tt>true</tt> indicates that it's
     * caused by network related failure or <tt>false</tt> when it's
     * the infrastructure.
     * @param {string} reason a label string identifying the reason for the page
     * reload which will be included in details of the log event
     */
    show(timeoutSeconds, isNetworkFailure, reason) {

        if (!overlay) {
            overlay
                = new PageReloadOverlayImpl(timeoutSeconds, isNetworkFailure);
        }
        // Log the page reload event
        if (!this.isVisible()) {
            // FIXME (CallStats - issue) this event will not make it to
            // the CallStats, because the log queue is not flushed, before
            // "fabric terminated" is sent to the backed
            APP.conference.logEvent(
                'page.reload', undefined /* value */, reason /* label */);
        }
        // If it's a network failure we enable the light overlay.
        overlay.show(isNetworkFailure);
    }
};
