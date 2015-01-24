/* jshint -W117 */
/* application specific logic */

function init() {

    RTC.start();
    xmpp.start(UI.getCreadentials);
}


$(document).ready(function () {

    if(API.isEnabled())
        API.init();

    UI.start();
    statistics.start();
    connectionquality.init();
    
    // Set default desktop sharing method
    desktopsharing.init();

    keyboardshortcut.init();
});

$(window).bind('beforeunload', function () {
    if(API.isEnabled())
        API.dispose();
});

