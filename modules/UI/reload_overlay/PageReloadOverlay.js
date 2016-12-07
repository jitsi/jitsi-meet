/* global $, APP, AJS */
const logger = require("jitsi-meet-logger").getLogger(__filename);

import Overlay from "../overlay/Overlay";

/**
 * An overlay dialog which is shown before the conference is reloaded. Shows
 * a warning message and counts down towards the reload.
 */
class PageReloadOverlayImpl extends Overlay{
    /**
     * Creates new <tt>PageReloadOverlayImpl</tt>
     * @param {number} timeoutSeconds how long the overlay dialog will be
     * displayed, before the conference will be reloaded.
     * @param {string} title the title of the overlay message
     * @param {string} message the message of the overlay
     * @param {string} buttonHtml the button html or an empty string if there's
     * no button
     * @param {boolean} isLightOverlay indicates if the overlay should be a
     * light overlay or a standard one
     */
    constructor(timeoutSeconds, title, message, buttonHtml, isLightOverlay) {
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

        this.title = title;
        this.message = message;
        this.buttonHtml = buttonHtml;
        this.isLightOverlay = isLightOverlay;
    }
    /**
     * Constructs overlay body with the warning message and count down towards
     * the conference reload.
     * @override
     */
    _buildOverlayContent() {
        return `<div class="inlay">
                    <span data-i18n=${this.title}
                          class='reload_overlay_title'></span>
                    <span data-i18n=${this.message}
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
                    ${this.buttonHtml}
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
        $("#reconnectNow").click(() => {
            APP.ConferenceUrl.reload();
        });

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

/**
 * Checks whether the page reload overlay has been displayed.
 * @return {boolean} <tt>true</tt> if the page reload overlay is currently
 * visible or <tt>false</tt> otherwise.
 */
export function isVisible() {
        return overlay && overlay.isVisible();
}

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
export function show(timeoutSeconds, isNetworkFailure, reason) {
    let title;
    let message;
    let buttonHtml;
    let isLightOverlay;

    if (isNetworkFailure) {
        title = "dialog.conferenceDisconnectTitle";
        message = "dialog.conferenceDisconnectMsg";
        buttonHtml
            = `<button id="reconnectNow" data-i18n="dialog.reconnectNow"
                    class="button-control button-control_primary
                            button-control_center"></button>`;
        isLightOverlay = true;
    }
    else {
        title = "dialog.conferenceReloadTitle";
        message = "dialog.conferenceReloadMsg";
        buttonHtml = "";
        isLightOverlay = false;
    }

    if (!overlay) {
        overlay = new PageReloadOverlayImpl(timeoutSeconds,
                                            title,
                                            message,
                                            buttonHtml,
                                            isLightOverlay);
    }
    // Log the page reload event
    if (!this.isVisible()) {
        // FIXME (CallStats - issue) this event will not make it to
        // the CallStats, because the log queue is not flushed, before
        // "fabric terminated" is sent to the backed
        APP.conference.logEvent(
            'page.reload', undefined /* value */, reason /* label */);
    }
    overlay.show();
}
