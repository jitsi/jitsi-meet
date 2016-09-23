/* global $, APP, interfaceConfig, AJS */
/* jshint -W101 */

/**
 * @class FeedbackStates
 *
 */
class FeedbackStates {

    getStates() {
        let states = {
            rate_feedback: this.getRateFeedbackState(),
            detailed_feedback: this.getDetailedFeedbackState()
        };

        return states;
    }

    /**
     * Constructs the html for the rated feedback window.
     *
     * @returns {string} the contructed html string
     */
    getRateFeedbackState() {
        let html = this._getHtmlForRateFeedback();
        let titleKey = 'dialog.feedbackQuestion';
        let title = APP.translation.translateString(titleKey);

        return {
            title,
            html
        };
    }

    _getHtmlForRateFeedback() {
        let feedbackHelp = APP.translation.translateString('dialog.feedbackHelp');
        let titleKey = 'dialog.rateExperience';
        let rateExperience = APP.translation.translateString(titleKey);
        return (
            `<form action="javascript:false;" onsubmit="return false;">
                <div class="feedback__rating">
                    <h3>${ rateExperience }</h3>
                    <p class="star-label">&nbsp;</p>
                    <div id="stars" class="feedback-stars">
                        <a class="star-btn">
                            <i class="icon-star shake-rotate"></i>
                        </a>
                        <a class="star-btn">
                            <i class="icon-star shake-rotate"></i>
                        </a>
                        <a class="star-btn">
                            <i class="icon-star shake-rotate"></i>
                        </a>
                        <a class="star-btn">
                            <i class="icon-star shake-rotate"></i>
                        </a>
                        <a class="star-btn">
                            <i class="icon-star shake-rotate"></i>
                        </a>
                    </div>
                    <p>&nbsp;</p>
                    <p>${ feedbackHelp }</p>
                </div>
            </form>`
        );
    }

    /**
     * Constructs the html for the detailed feedback window.
     *
     * @returns {string} the contructed html string
     */
    getDetailedFeedbackState() {
        let title = 'Detailed Feedback';
        let html = this._getHtmlForDetailedFeedback();
        let buttons = {
            Submit: true,
            Close: false
        };
        return {
            title,
            html,
            buttons,
            focus: 0
        };
    }

    _getHtmlForDetailedFeedback() {
        let msgKey = 'dialog.sorryFeedback';
        let msg = APP.translation.translateString(msgKey);
        return (
            `<div class="feedback__details">
                    <p>${msg}</p>
                    <br/>
                    <textarea id="feedbackTextArea" rows="10"
                              cols="50" autofocus></textarea>
            </div>`
        );
    }
}

const feedbackStates = new FeedbackStates();

export default feedbackStates;