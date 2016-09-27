/* global $, APP, config, interfaceConfig, JitsiMeetJS */
import UIEvents from "../../../service/UI/UIEvents";
import FeedabckWindow from "./FeedbackWindow";

/**
 * Shows / hides the feedback button.
 * @private
 */
function _toggleFeedbackIcon() {
    $('#feedbackButtonDiv').toggleClass("hidden");
}

/**
 * Shows / hides the feedback button.
 * @param {show} set to {true} to show the feedback button or to  {false}
 * to hide it
 * @private
 */
function _showFeedbackButton (show) {
    var feedbackButton = $("#feedbackButtonDiv");

    if (show)
        feedbackButton.css("display", "block");
    else
        feedbackButton.css("display", "none");
}

/**
 * Defines all methods in connection to the Feedback window.
 *
 * @type {{openFeedbackWindow: Function}}
 */
var Feedback = {

    /**
     * Initialise the Feedback functionality.
     * @param emitter the EventEmitter to associate with the Feedback.
     */
    init: function (emitter) {
        // CallStats is the way we send feedback, so we don't have to initialise
        // if callstats isn't enabled.
        if (!APP.conference.isCallstatsEnabled())
            return;

        // If enabled property is still undefined, i.e. it hasn't been set from
        // some other module already, we set it to true by default.
        if (typeof this.enabled == "undefined")
            this.enabled = true;

        _showFeedbackButton(this.enabled);

        this.window = new FeedabckWindow({});

        $("#feedbackButton").click(Feedback.openFeedbackWindow);

        // Show / hide the feedback button whenever the film strip is
        // shown / hidden.
        emitter.addListener(UIEvents.TOGGLE_FILM_STRIP, function () {
            _toggleFeedbackIcon();
        });
    },
    /**
     * Enables/ disabled the feedback feature.
     */
    enableFeedback: function (enable) {
        if (this.enabled !== enable)
            _showFeedbackButton(enable);
        this.enabled = enable;
    },

    /**
     * Indicates if the feedback functionality is enabled.
     *
     * @return true if the feedback functionality is enabled, false otherwise.
     */
    isEnabled: function() {
        return this.enabled && APP.conference.isCallstatsEnabled();
    },

    /**
     * Returns true if the feedback window is currently visible and false
     * otherwise.
     * @return {boolean} true if the feedback window is visible, false
     * otherwise
     */
    isVisible: function() {
        return $(".feedback").is(":visible");
    },

    /**
     * Indicates if the feedback is submitted.
     *
     * @return {boolean} {true} to indicate if the feedback is submitted,
     * {false} - otherwise
     */
    isSubmitted: function() {
        return Feedback.window.submitted;
    },

    /**
     * Opens the feedback window.
     */
    openFeedbackWindow: function (callback) {
        Feedback.window.show(callback);

        JitsiMeetJS.analytics.sendEvent('feedback.open');
    },

    /**
     * Returns the feedback score.
     *
     * @returns {*}
     */
    getFeedbackScore: function() {
        return Feedback.window.feedbackScore;
    },

    /**
     * Returns the feedback free text.
     *
     * @returns {null|*|message}
     */
    getFeedbackText: function() {
        return Feedback.window.feedbackText;
    }
};

module.exports = Feedback;