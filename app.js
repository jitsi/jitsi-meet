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
        this.desktopsharing = require("./modules/desktopsharing/desktopsharing");
        this.xmpp = require("./modules/xmpp/xmpp");
        this.keyboardshortcut = require("./modules/keyboardshortcut/keyboardshortcut");
        this.translation = require("./modules/translation/translation");
        this.settings = require("./modules/settings/Settings");
        this.DTMF = require("./modules/DTMF/DTMF");
        this.members = require("./modules/members/MemberList");
    }
};

function init() {

    APP.RTC.start();
    APP.xmpp.start();
    APP.statistics.start();
    APP.connectionquality.init();

    // Set default desktop sharing method
    APP.desktopsharing.init();

    APP.keyboardshortcut.init();
    APP.members.start();
}


$(document).ready(function () {

    var URLPRocessor = require("./modules/URLProcessor/URLProcessor");
    URLPRocessor.setConfigParametersFromUrl();
    APP.init();

    APP.translation.init();

    if(APP.API.isEnabled())
        APP.API.init();

    APP.UI.start(init);

});

$(window).bind('beforeunload', function () {
    if(APP.API.isEnabled())
        APP.API.dispose();
});

module.exports = APP;

