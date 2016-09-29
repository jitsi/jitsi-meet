/* global $, APP, interfaceConfig, AJS */

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
 * Constructs the html for the rated feedback window.
 *
 * @returns {string} the contructed html string
 */
let createRateFeedbackHTML = function () {
    let rateExperience
            = APP.translation.translateString('dialog.rateExperience'),
        feedbackHelp = APP.translation.translateString('dialog.feedbackHelp');

    let starClassName = (interfaceConfig.ENABLE_FEEDBACK_ANIMATION)
        ? "icon-star shake-rotate"
        : "icon-star";

    return `
        <div class="aui-dialog2-content feedback__content">
            <form id="feedbackForm"
                action="javascript:false;" onsubmit="return false;">
                <div class="feedback__rating">
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
                <textarea id="feedbackTextArea"
                    rows="10" cols="40" autofocus></textarea>
            </form>
        </div>`;
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
        };
    });

    // Init stars to correspond to previously entered feedback.
    if (Feedback.feedbackScore > 0) {
        toggleStars(Feedback.feedbackScore - 1);
    }

    if (Feedback.feedbackMessage && Feedback.feedbackMessage.length > 0)
        $('#feedbackTextArea').text(Feedback.feedbackMessage);

    $('#feedbackTextArea').focus();
};

function onFeedbackSubmitted(Feedback) {
    let form = $('#feedbackForm');
    let message = form.find('textarea').val();

    APP.conference.sendFeedback(
        Feedback.feedbackScore,
        message);

    // TODO: make sendFeedback return true or false. (done in Kostya's PR)
    Feedback.submitted = true;

    //Remove history is submitted
    //Feedback.feedbackScore = -1;
    //Feedback.feedbackMessage ='';
    Feedback.hide();
}

/**
 * @class Dialog
 *
 */
export default class Dialog {

    constructor() {
        this.feedbackScore = -1;
        this.feedbackMessage = '';
        this.submitted = false;
        this.onCloseCallback = null;
    }

    setFeedbackMessage() {
        let message = $('#feedbackTextArea').val();

        this.feedbackMessage = message;
    }

    show(cb) {
        if (typeof cb !== 'function') {
            cb = function() { };
        }
        this.onCloseCallback = cb;
        let title = APP.translation.translateString('dialog.rateExperience');
        let self = this;

        this.window = APP.UI.messageHandler.openDialog(
            title,
            createRateFeedbackHTML(),
            true,
            {'close': true, 'submit': true},
            () => {onFeedbackSubmitted(self);},
            () => {onLoadRateFunction(self);},
            () => {
                self.hide();
                cb();
            }
        );
    }

    hide() {
        this.setFeedbackMessage();
        this.window.close();
    }
}
