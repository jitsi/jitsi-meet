/* global $, APP, AJS */

import { reload } from '../../util/helpers';

let $overlay;

/**
 * Conference reload counter in seconds.
 * @type {number}
 */
let timeLeft;

/**
 * Conference reload timeout in seconds.
 * @type {number}
 */
let timeout;

/**
 * Internal function that constructs overlay with the warning message and count
 * down towards the conference reload.
 */
function buildReloadOverlayHtml() {
    $overlay = $(`
        <div class='overlay_container'>
            <div class='overlay_content'>
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
                </div>
            </div>
        </div>`);

    APP.translation.translateElement($overlay);
}

/**
 * Updates the progress indicator position and the label with the time left.
 */
function updateDisplay() {

    const timeLeftTxt
        = APP.translation.translateString(
            "dialog.conferenceReloadTimeLeft",
            { seconds: timeLeft });
    $("#reloadSecRemaining").text(timeLeftTxt);

    const ratio = (timeout-timeLeft)/timeout;
    AJS.progressBars.update("#reloadProgressBar", ratio);
}

/**
 * Starts the reload countdown with the animation.
 * @param {number} timeoutSeconds how many seconds before the conference
 * reload will happen.
 */
function start(timeoutSeconds) {

    timeLeft = timeout = timeoutSeconds;

    // Initialize displays
    updateDisplay();

    var intervalId = window.setInterval(function() {

        if (timeLeft >= 1) {
            timeLeft -= 1;
            console.info("Reloading in " + timeLeft + " seconds...");
        }

        updateDisplay();

        if (timeLeft === 0) {
            console.info("Reloading!");
            window.clearInterval(intervalId);
            reload();
        }
    }, 1000);
}

export default {
    /**
     * Shows the page reload overlay which will do the conference reload after
     * the given amount of time.
     *
     * @param {number} timeoutSeconds how many seconds before the conference
     * reload will happen.
     */
    show(timeoutSeconds) {

        !$overlay && buildReloadOverlayHtml();

        if (!$overlay.parents('body').length) {
            $overlay.appendTo('body');
            start(timeoutSeconds);
        }
    }
};
