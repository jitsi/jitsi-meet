/* jshint -W117 */
/* application specific logic */

var APP =
{
    init: function () {
        this.UI = require("./modules/UI/UI");
        this.API = require("./modules/API/API");
        this.connectionquality = require("./modules/connectionquality/connectionquality");
        this.statistics = require("./modules/statistics/statistics");
        this.RTC = require("./modules/RTC/RTC");
        this.simulcast = require("./modules/simulcast/simulcast");
        this.desktopsharing = require("./modules/desktopsharing/desktopsharing");
        this.xmpp = require("./modules/xmpp/xmpp");
        this.keyboardshortcut = require("./modules/keyboardshortcut/keyboardshortcut");
    }
};

function init() {

    APP.RTC.start();
    APP.xmpp.start(APP.UI.getCredentials());
    APP.statistics.start();
    APP.connectionquality.init();

    // Set default desktop sharing method
    APP.desktopsharing.init();

    APP.keyboardshortcut.init();
}


$(document).ready(function () {

    APP.init();

    if(APP.API.isEnabled())
        APP.API.init();

    APP.UI.start(init);

});

$(window).bind('beforeunload', function () {
    if(APP.API.isEnabled())
        APP.API.dispose();
});

module.exports = APP;

