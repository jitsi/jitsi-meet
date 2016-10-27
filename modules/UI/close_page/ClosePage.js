/* global $, _, APP */

const compiledTpl = _.template(`
    <div class="close-message">
        <div class="thanks-msg">
            <p data-i18n="<%= thankMsg %>"
               data-i18n-options='{ "postProcess": "resolveAppName" }'></p>
        </div>
        <div class="hint-msg">
            <p>
                <span>Did you know?</span>
                <span class="hint-msg__holder"
                    data-i18n="<%= hintMsg %>"
                    data-i18n-options='{ "postProcess": "resolveAppName" }'>
                </span>
            </p>
            <div class="happy-software"></div>
        </div>
    </div>`);

/**
 * Returns feedback message
 *
 * @param {boolean} feedback
 * @returns {string}
 */
function getThankMsg(feedback) {
    return feedback ?
        'closePage.thankMessage.withFeedback' :
        'closePage.thankMessage.withoutFeedback';
}

/**
 * Returns random hint message
 *
 * @returns {string}
 */
function getHintMsg() {
    //TODO: add randomizer
    return 'closePage.hintMessage';
}

/**
 * @class ClosePage
 *
 */
export default class ClosePage {

    constructor(options) {
        this.feedback = options.feedback || null;
    }

    /**
     * Render closePage into <body>
     */
    render() {
        const fb = this.feedback;
        const $html = $(compiledTpl({
            thankMsg: getThankMsg(fb),
            hintMsg: getHintMsg()
        }));

        $('body').html(APP.translation.translateElement($html));
    }
}

