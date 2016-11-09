/* global $, APP, interfaceConfig */

const labels = {
    1: 'Very Bad',
    2: 'Bad',
    3: 'Average',
    4: 'Good',
    5: 'Very Good'
};

/**
 * Toggles the appropriate css class for the given number of stars, to
 * indicate that those stars have been clicked/selected.
 *
 * @param starCount the number of stars, for which to toggle the css class
 */
function toggleStars(starCount) {
    let labelEl = $('#starLabel');
    let label = starCount >= 0 ?
        labels[starCount + 1] :
        '';

    $('#stars > a').each(function(index, el) {
        if (index <= starCount) {
            el.classList.add("starHover");
        } else
            el.classList.remove("starHover");
    });
    labelEl.text(label);
}

/**
 * Constructs the html for the rated feedback window.
 *
 * @returns {string} the contructed html string
 */
function createRateFeedbackHTML() {

    let starClassName = (interfaceConfig.ENABLE_FEEDBACK_ANIMATION)
        ? "icon-star-full shake-rotate"
        : "icon-star-full";

    return `
        <form id="feedbackForm"
            action="javascript:false;" onsubmit="return false;">
            <div class="rating">
                <div class="star-label">
                    <p id="starLabel">&nbsp;</p>
                </div>
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
            </div>
            <div class="details">
                <textarea id="feedbackTextArea" class="input-control" 
                    data-i18n="[placeholder]dialog.feedbackHelp"></textarea>
            </div>
        </form>`;
}

/**
 * Feedback is loaded callback
 * Calls when Modal window is in DOM
 *
 * @param Feedback
 */
let onLoadFunction = function (Feedback) {
    $('#stars > a').each((index, el) => {
        el.onmouseover = function(){
            toggleStars(index);
        };
        el.onmouseleave = function(){
            toggleStars(Feedback.feedbackScore - 1);
        };
        el.onclick = function(){
            Feedback.feedbackScore = index + 1;
            Feedback.setFeedbackMessage();
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

/**
 * On Feedback Submitted callback
 *
 * @param Feedback
 */
function onFeedbackSubmitted(Feedback) {
    let form = $('#feedbackForm');
    let message = form.find('textarea').val();

    APP.conference.sendFeedback(
        Feedback.feedbackScore,
        message);

    // TODO: make sendFeedback return true or false.
    Feedback.submitted = true;

    //Remove history is submitted
    Feedback.feedbackScore = -1;
    Feedback.feedbackMessage = '';
    Feedback.onHide();
}

/**
 * On Feedback Closed callback
 *
 * @param Feedback
 */
function onFeedbackClosed(Feedback) {
    Feedback.onHide();
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
        this.onCloseCallback = function() {};

        this.setDefaultOptions();
    }

    setDefaultOptions() {
        var self = this;

        this.options = {
            titleKey: 'dialog.rateExperience',
            msgString: createRateFeedbackHTML(),
            loadedFunction: function() {onLoadFunction(self);},
            submitFunction: function() {onFeedbackSubmitted(self);},
            closeFunction: function() {onFeedbackClosed(self);},
            wrapperClass: 'feedback',
            size: 'medium'
        };
    }

    setFeedbackMessage() {
        this.feedbackMessage = $('#feedbackTextArea').val();
    }

    show(cb) {
        const options = this.options;
        if (typeof cb === 'function') {
            this.onCloseCallback = cb;
        }

        this.window = APP.UI.messageHandler.openTwoButtonDialog(options);
    }

    onHide() {
        this.onCloseCallback({
            feedbackSubmitted: this.submitted
        });
    }
}
