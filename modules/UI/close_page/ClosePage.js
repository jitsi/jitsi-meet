/* global $, _ */

const compiledTpl = _.template(`
    <div class="close-message">
        <div class="thanks-msg">
            <p><%= thankMsg %></p>
        </div>
        <div class="hint-msg">
            <p>
                <span>Did you know?</span>
                <span class="hint-msg__holder"><%= hintMsg %></span>
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
function getThankMas(feedback) {
    return feedback ?
        'Thank you for your feedback!' :
        'Thank you for using jitsi';
}

/**
 * Returns random hint message
 *
 * @returns {string}
 */
function getHintMsg() {
    //TODO: add randomizer
    return `you can use video calls with jitsi 
            for your business`;
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
        let fb = this.feedback;
        let htmlStr = compiledTpl({
            thankMsg: getThankMas(fb),
            hintMsg: getHintMsg()
        });

        $('body').html(htmlStr);
    }
}

