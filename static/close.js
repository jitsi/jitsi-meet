/* global interfaceConfig */
//list of tips
var hints = [
    "You can pin participants by clicking on their thumbnails.",// jshint ignore:line
    "You can tell others you have something to say by using the \"Raise Hand\" feature",// jshint ignore:line
    "You can learn about key shortcuts by pressing Shift+?",// jshint ignore:line
    "You can learn more about the state of everyone's connection by hovering on the bars in their thumbnail",// jshint ignore:line
    "You can hide all thumbnails by using the button in the bottom right corner"// jshint ignore:line
];

/**
 * Get a random hint meessage from hint array.
 *
 * @return {string} the hint message.
 */
function getHint(){
    var l = hints.length - 1;
    var n = Math.round(Math.random() * l);

    return hints[n];
}

/**
 * Inserts text message
 * into DOM element
 *
 * @param id {string} element identificator
 * @param msg {string} text message
 */
// eslint-disable-next-line no-unused-vars
function insertTextMsg(id, msg){
    var el = document.getElementById(id);

    if (el)
        el.innerHTML = msg;
}

/**
 * Sets the hint and thanks messages. Will be executed on load event.
 */
function onLoad() {
    //Works only for close2.html because close.html doesn't have this element.
    insertTextMsg('thanksMessage',
        'Thank you for using ' + interfaceConfig.APP_NAME);

    // If there is a setting show a special message only for the guests
    if (interfaceConfig.CLOSE_PAGE_GUEST_HINT) {
        if ( window.sessionStorage.getItem('guest') === 'true' ) {
            var element = document.getElementById('hintQuestion');
            element.classList.add('hide');
            insertTextMsg('hintMessage', interfaceConfig.CLOSE_PAGE_GUEST_HINT);
            return;
        }
    }

    insertTextMsg('hintMessage', getHint());
}

window.onload = onLoad;
