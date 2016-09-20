/* global $, APP, interfaceConfig, AJS */
/* jshint -W101 */

import FeedbackStates from "./FeedbackStates";

/**
 * @class Dialog
 *
 */
export default class Dialog {

    constructor() {
        this.states = FeedbackStates.getStates();

        let boundRateFunction = this.onLoadRateFunction.bind(this);
        this.states.rate_feedback.onLoad = boundRateFunction;

        let boundDetailedFunction = this.onLoadDetailedFunction.bind(this);
        this.states.detailed_feedback.onLoad = boundDetailedFunction;

        this.feedbackScore = -1;
        this.onCloseCallback = null;
        this.options = {};
        this.state = 'rate_feedback';
    }

    setState(state) {
        let newState = state || this.state;
        let cb = this.states[newState].onLoad;

        $.prompt.goToState(newState, false, cb);
    }

    show(cb) {
        if (typeof cb == 'function') {
            this.onCloseCallback = cb;
        }

        APP.UI.messageHandler.openDialogWithStates(this.states, this.options);
        this.setState();

    }

    hide() {
        $.prompt.close();

        if (this.onCloseCallback) {
            this.onCloseCallback();
            this.onCloseCallback = null;
        }
    }

    onFeedbackSubmitted() {
        let message = $('#feedbackTextArea').val();
        let self = this;

        if (message && message.length > 0) {
            APP.conference.sendFeedback(
                self.feedbackScore,
                message);
        }
        this.hide();
    }

    /**
     * Callback for Rate Feedback
     *
     * @param Feedback
     */
    onLoadRateFunction() {
        let self = this;

        $('#stars > a').each((index, el) => {
            el.onmouseover = function() {
                self.toggleStars(index);
            };
            el.onmouseleave = function() {
                self.toggleStars(self.feedbackScore - 1);
            };
            el.onclick = function(){
                self.feedbackScore = index + 1;

                // If the feedback is less than 3 stars we're going to
                // ask the user for more information.
                if (self.feedbackScore > 3) {
                    APP.conference.sendFeedback(self.feedbackScore, "");
                    self.hide();
                } else {
                    self.setState('detailed_feedback');
                }
            };
        });

        // Init stars to correspond to previously entered feedback.
        if (this.feedbackScore > 0) {
            this.toggleStars(this.feedbackScore - 1);
        }
    }

    /**
     * Toggles the appropriate css class for the given number of stars, to
     * indicate that those stars have been clicked/selected.
     *
     * @param starCount the number of stars, for which to toggle the css class
     */
    toggleStars(starCount) {
        $('#stars > a').each(function(index, el) {
            if (index <= starCount) {
                el.classList.add("starHover");
            } else
                el.classList.remove("starHover");
        });
    }

    /**
     * Callback for Detailed Feedback
     *
     * @param Feedback
     */
    onLoadDetailedFunction() {
        let self = this;
        let submitBtn = $('[name="jqi_detailed_feedback_buttonSubmit"]');
        let closeButtons = $('[name="jqi_detailed_feedback_buttonClose"]');
        closeButtons = closeButtons.add('.aui-iconfont-close-dialog');


        if (submitBtn && submitBtn.length) {
            submitBtn.on('click', (e) => {
                e.preventDefault();
                self.onFeedbackSubmitted();
            });
        }
        if (closeButtons && closeButtons.length) {
            closeButtons.on('click', (e) => {
                e.preventDefault();
                self.hide();
            });
        }
    }
}
