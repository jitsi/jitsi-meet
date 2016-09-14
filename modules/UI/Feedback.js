/* global $, APP, config, interfaceConfig, JitsiMeetJS */
import UIEvents from "../../service/UI/UIEvents";
import UIUtil from "./util/UIUtil";

/**
 * Constructs the html for the overall feedback window.
 *
 * @returns {string} the constructed html string
 */
var constructOverallFeedbackHtml = function() {
    var feedbackQuestion = (Feedback.feedbackScore < 0)
        ? '<br/><br/>' + APP.translation
        .translateString("dialog.feedbackQuestion")
        : '';

    var message = '<div class="feedback"><div>' +
        '<div class="feedbackTitle">' +
        APP.translation.translateString("dialog.thankYou",
                                        {appName:interfaceConfig.APP_NAME}) +
        '</div>' +
        feedbackQuestion +
        '</div><br/><br/>' +
        '<div id="stars">' +
        '<a><i class="icon-star icon-star-full"></i></a>' +
        '<a><i class="icon-star icon-star-full"></i></a>' +
        '<a><i class="icon-star icon-star-full"></i></a>' +
        '<a><i class="icon-star icon-star-full"></i></a>' +
        '<a><i class="icon-star icon-star-full"></i></a>' +
        '</div></div>';

    return message;
};

/**
 * Constructs the html for the detailed feedback window.
 *
 * @returns {string} the contructed html string
 */
var constructDetailedFeedbackHtml = function() {
    // Construct the html, which will be served as a dialog message.
    var message = '<div class="feedback">' +
        '<div class="feedbackTitle">' +
        APP.translation.translateString("dialog.sorryFeedback") +
        '</div><br/><br/>' +
        '<div class="feedbackDetails">' +
        '<textarea id="feedbackTextArea" rows="10" cols="50" autofocus>' +
        '</textarea>' +
        '</div></div>';

    return message;
};

var createRateFeedbackHTML = function () {
    var rate = APP.translation.translateString('dialog.rateExperience'),
        help = APP.translation.translateString('dialog.feedbackHelp');

    return `
        <div class="feedback-rating text-center">
            <h2>${ rate }</h2>
            <p class="star-label">&nbsp;</p>
            <div id="stars" class="feedback-stars">
                <a class="star-btn">
                    <i class="fa fa-star shake-rotate"></i>
                </a>
                <a class="star-btn">
                    <i class="fa fa-star shake-rotate"></i>
                </a>
                <a class="star-btn">
                    <i class="fa fa-star shake-rotate"></i>
                </a>
                <a class="star-btn">
                    <i class="fa fa-star shake-rotate"></i>
                </a>
                <a class="star-btn">
                    <i class="fa fa-star shake-rotate"></i>
                </a>
            </div>
            <p>&nbsp;</p>
            <p>${ help }</p>
        </div>
    `;
};

/**
 * The callback function corresponding to the openFeedbackWindow parameter.
 *
 * @type {function}
 */
var feedbackWindowCallback = null;

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
 * @type {{feedbackScore: number, openFeedbackWindow: Function,
 * toggleStars: Function, hoverStars: Function, unhoverStars: Function}}
 */
var Feedback = {
    /**
     * The feedback score. -1 indicates no score has been given for now.
     */
    feedbackScore: -1,

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

        $("#feedbackButton").click(function (event) {
            Feedback.openFeedbackWindow();
        });

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
     * Opens the feedback window.
     */
    openFeedbackWindow: function (callback) {
        feedbackWindowCallback = callback;
        // Add all mouse and click listeners.
        var onLoadFunction = function (event) {
            $('#stars >a').each(function(index) {
                // On star mouse over.
                $(this).get(0).onmouseover = function(){
                    Feedback.hoverStars(index);
                };
                // On star mouse leave.
                $(this).get(0).onmouseleave = function(){
                    Feedback.unhoverStars(index);
                };
                // On star click.
                $(this).get(0).onclick = function(){
                    Feedback.toggleStars(index);
                    Feedback.feedbackScore = index+1;

                    // If the feedback is less than 3 stars we're going to
                    // ask the user for more information.
                    if (Feedback.feedbackScore > 3) {
                        APP.conference.sendFeedback(Feedback.feedbackScore, "");
                        if (feedbackWindowCallback)
                            feedbackWindowCallback();
                        else
                            APP.UI.messageHandler.closeDialog();
                    }
                    else {
                        feedbackDialog.goToState('detailed_feedback');
                    }
                };
                // Init stars to correspond to previously entered feedback.
                if (Feedback.feedbackScore > 0
                    && index < Feedback.feedbackScore) {
                    Feedback.hoverStars(index);
                    Feedback.toggleStars(index);
                }
            });
        };

        // Defines the different states of the feedback window.
        var states = {
            overall_feedback: {
                html: createRateFeedbackHTML(),
                persistent: false,
                buttons: {},
                closeText: '',
                focus: "div[id='stars']",
                position: {width: 500}
            },
            detailed_feedback: {
                html: constructDetailedFeedbackHtml(),
                buttons: {"Submit": true, "Cancel": false},
                closeText: '',
                focus: "textarea[id='feedbackTextArea']",
                position: {width: 500},
                submit: function(e,v,m,f) {
                    e.preventDefault();
                    if (v) {
                        var feedbackDetails
                            = document.getElementById("feedbackTextArea").value;

                        if (feedbackDetails && feedbackDetails.length > 0) {
                            APP.conference.sendFeedback( Feedback.feedbackScore,
                                                    feedbackDetails);
                        }

                        if (feedbackWindowCallback)
                            feedbackWindowCallback();
                        else
                            APP.UI.messageHandler.closeDialog();
                    } else {
                        // User cancelled
                        if (feedbackWindowCallback)
                            feedbackWindowCallback();
                        else
                            APP.UI.messageHandler.closeDialog();
                    }
                }
            }
        };

        // Create the feedback dialog.
        var feedbackDialog
            = APP.UI.messageHandler.openDialogWithStates(
                states,
                {   persistent: false,
                    buttons: {},
                    closeText: '',
                    loaded: onLoadFunction,
                    position: {width: 500}}, null);
        JitsiMeetJS.analytics.sendEvent('feedback.open');
    },
    /**
     * Toggles the appropriate css class for the given number of stars, to
     * indicate that those stars have been clicked/selected.
     *
     * @param starCount the number of stars, for which to toggle the css class
     */
    toggleStars: function (starCount)
    {
        $('#stars >a >i').each(function(index) {
            if (index <= starCount) {
                $(this).removeClass("icon-star");
            }
            else
                $(this).addClass("icon-star");
        });
    },
    /**
     * Toggles the appropriate css class for the given number of stars, to
     * indicate that those stars have been hovered.
     *
     * @param starCount the number of stars, for which to toggle the css class
     */
    hoverStars: function (starCount)
    {
        $('#stars >a >i').each(function(index) {
            if (index <= starCount)
                $(this).addClass("starHover");
        });
    },
    /**
     * Toggles the appropriate css class for the given number of stars, to
     * indicate that those stars have been un-hovered.
     *
     * @param starCount the number of stars, for which to toggle the css class
     */
    unhoverStars: function (starCount)
    {
        $('#stars >a >i').each(function(index) {
            if (index <= starCount && $(this).hasClass("icon-star"))
                $(this).removeClass("starHover");
        });
    }
};

// Exports the Feedback class.
module.exports = Feedback;
