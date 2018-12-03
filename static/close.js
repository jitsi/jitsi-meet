/* global interfaceConfig */
// list of tips
const hints = [
    'You can pin participants by clicking on their thumbnails.',
    'You can tell others you have something to say by using the "Raise Hand" '
        + 'feature',
    'You can learn about key shortcuts by pressing Shift+?',
    'You can learn more about the state of everyone\'s connection by hovering '
        + 'on the bars in their thumbnail',
    'You can hide all thumbnails by using the button in the bottom right corner'
];

/**
 * Get a random hint meessage from hint array.
 *
 * @return {string} the hint message.
 */
function getHint() {
    const l = hints.length - 1;
    const n = Math.round(Math.random() * l);

    return hints[n];
}

/**
 * Inserts text message
 * into DOM element
 *
 * @param id {string} element identificator
 * @param msg {string} text message
 */
function insertTextMsg(id, msg) {
    const el = document.getElementById(id);

    if (el) {
        el.innerHTML = msg;
    }
}

/**
 * Sets the hint and thanks messages. Will be executed on load event.
 */
function onLoad() {
    // Intentionally use string concatenation as this file does not go through
    // babel but IE11 is still supported.
    // eslint-disable-next-line prefer-template
    const thankYouMessage = 'Thank you for using ' + interfaceConfig.APP_NAME;

    // Works only for close2.html because close.html doesn't have this element.
    insertTextMsg('thanksMessage', thankYouMessage);

    // If there is a setting show a special message only for the guests
    if (interfaceConfig.CLOSE_PAGE_GUEST_HINT) {
        if (window.sessionStorage.getItem('guest') === 'true') {
            const element = document.getElementById('hintQuestion');

            element.classList.add('hide');
            insertTextMsg('hintMessage', interfaceConfig.CLOSE_PAGE_GUEST_HINT);

            return;
        }
    }

    insertTextMsg('hintMessage', getHint());
}

window.onload = onLoad;
