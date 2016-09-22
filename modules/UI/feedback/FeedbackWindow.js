/* global $, APP, interfaceConfig, AJS */
/* jshint -W101 */

const selector = '#aui-feedback-dialog';

/**
 * Toggles the appropriate css class for the given number of stars, to
 * indicate that those stars have been clicked/selected.
 *
 * @param starCount the number of stars, for which to toggle the css class
 */
let toggleStars = function(starCount) {
    $('#stars > a').each(function(index, el) {
        if (index <= starCount) {
            el.classList.add("starHover");
        } else
            el.classList.remove("starHover");
    });
};

/**
 * Constructs the html for the detailed feedback window.
 *
 * @returns {string} the contructed html string
 */
let constructDetailedFeedbackHtml = function() {

    return `
        <div class="aui-dialog2-content feedback__content">
            <div class="feedback__details">
                <p>${APP.translation.translateString("dialog.sorryFeedback")}</p>
                <br/><br/>
                <textarea id="feedbackTextArea" rows="10" cols="50" autofocus></textarea>
            </div>
        </div>
        <footer class="aui-dialog2-footer feedback__footer">
            <div class="aui-dialog2-footer-actions">
                <button id="dialog-close-button" class="aui-button aui-button_close">Close</button>
                <button id="dialog-submit-button" class="aui-button aui-button_submit">Submit</button>
            </div>
        </footer>
        `;
};

/**
 * Constructs the html for the rated feedback window.
 *
 * @returns {string} the contructed html string
 */
let createRateFeedbackHTML = function (Feedback) {
    let rateExperience
            = APP.translation.translateString('dialog.rateExperience'),
        feedbackHelp = APP.translation.translateString('dialog.feedbackHelp'),
        feedbackQuestion = (Feedback.feedbackScore < 0)
        ? `<p><br/>${APP.translation.translateString('dialog.feedbackQuestion')}</p>`
        : '';

    let starClassName = (interfaceConfig.ENABLE_FEEDBACK_ANIMATION)
                            ? "icon-star shake-rotate"
                            : "icon-star";

    return `
        <div class="aui-dialog2-content feedback__content">
            ${feedbackQuestion}
            <form action="javascript:false;" onsubmit="return false;">
                <div class="feedback__rating">
                    <h2>${ rateExperience }</h2>
                    <p class="star-label">&nbsp;</p>
                    <div id="stars" class="feedback-stars">
                        <a class="star-btn">
                            <i class=${ starClassName }></i>
                        </a>
                        <a class="star-btn">
                            <i class=${ starClassName }></i>
                        </a>
                        <a class="star-btn">
                            <i class=${ starClassName }></i>
                        </a>
                        <a class="star-btn">
                            <i class=${ starClassName }></i>
                        </a>
                        <a class="star-btn">
                            <i class=${ starClassName }></i>
                        </a>
                    </div>
                    <p>&nbsp;</p>
                    <p>${ feedbackHelp }</p>
                </div>
            </form>
        </div>
`;
};

/**
 * Callback for Rate Feedback
 *
 * @param Feedback
 */
let onLoadRateFunction = function (Feedback) {
    $('#stars > a').each((index, el) => {
        el.onmouseover = function(){
            toggleStars(index);
        };
        el.onmouseleave = function(){
            toggleStars(Feedback.feedbackScore - 1);
        };
        el.onclick = function(){
            Feedback.feedbackScore = index + 1;

            // If the feedback is less than 3 stars we're going to
            // ask the user for more information.
            if (Feedback.feedbackScore > 3) {
                APP.conference.sendFeedback(Feedback.feedbackScore, "");
                Feedback.hide();
            } else {
                Feedback.setState('detailed_feedback');
            }
        };
    });

    // Init stars to correspond to previously entered feedback.
    if (Feedback.feedbackScore > 0) {
        toggleStars(Feedback.feedbackScore - 1);
    }
};

/**
 * Callback for Detailed Feedback
 *
 * @param Feedback
 */
let onLoadDetailedFunction = function(Feedback) {
    let submitBtn = Feedback.$el.find('#dialog-submit-button');
    let closeBtn = Feedback.$el.find('#dialog-close-button');

    if (submitBtn && submitBtn.length) {
        submitBtn.on('click', (e) => {
            e.preventDefault();
            Feedback.onFeedbackSubmitted();
        });
    }
    if (closeBtn && closeBtn.length) {
        closeBtn.on('click', (e) => {
            e.preventDefault();
            Feedback.hide();
        });
    }

    $('#feedbackTextArea').focus();
};

/**
 * @class Dialog
 *
 */
export default class Dialog {

    constructor(options) {
        this.feedbackScore = -1;
        this.onCloseCallback = null;

        this.states = {
            rate_feedback: {
                getHtml: createRateFeedbackHTML,
                onLoad: onLoadRateFunction
            },
            detailed_feedback: {
                getHtml: constructDetailedFeedbackHtml,
                onLoad: onLoadDetailedFunction
            }
        };
        this.state = options.state || 'rate_feedback';

        this.window = AJS.dialog2(selector, {
            closeOnOutsideClick: true
        });
        this.$el = this.window.$el;

        AJS.dialog2(selector).on("hide", function() {
            if (this.onCloseCallback) {
                this.onCloseCallback();
                this.onCloseCallback = null;
            }
        }.bind(this));

        this.setState();
    }

    setState(state) {
        let newState = state || this.state;

        let htmlStr = this.states[newState].getHtml(this);

        this.$el.html(htmlStr);

        this.states[newState].onLoad(this);
    }

    show(cb) {
        this.setState('rate_feedback');
        if (typeof cb == 'function') {
            this.onCloseCallback = cb;
        }

        this.window.show();

    }

    hide() {
        this.window.hide();
    }

    onFeedbackSubmitted() {
        let message = this.$el.find('textarea').val();
        let self = this;

        if (message && message.length > 0) {
            APP.conference.sendFeedback(
                self.feedbackScore,
                message);
        }
        this.hide();
    }

}
