/* global $ */
var PanelToggler = require("../side_pannels/SidePanelToggler");
var AnalyticsAdapter = require("../../statistics/AnalyticsAdapter");

var buttonHandlers = {
    "bottom_toolbar_contact_list": function () {
        AnalyticsAdapter.sendEvent('bottomtoolbar.contacts.toggled');
        BottomToolbar.toggleContactList();
    },
    "bottom_toolbar_film_strip": function () {
        AnalyticsAdapter.sendEvent('bottomtoolbar.filmstrip.toggled');
        BottomToolbar.toggleFilmStrip();
    },
    "bottom_toolbar_chat": function () {
        AnalyticsAdapter.sendEvent('bottomtoolbar.chat.toggled');
        BottomToolbar.toggleChat();
    }
};

var BottomToolbar = (function (my) {
    my.init = function () {
        for(var k in buttonHandlers)
            $("#" + k).click(buttonHandlers[k]);
    };

    my.toggleChat = function() {
        PanelToggler.toggleChat();
    };

    my.toggleContactList = function() {
        PanelToggler.toggleContactList();
    };

    my.toggleFilmStrip = function() {
        var filmstrip = $("#remoteVideos");
        filmstrip.toggleClass("hidden");
    };

    $(document).bind("remotevideo.resized", function (event, width, height) {
        var bottom = (height - $('#bottomToolbar').outerHeight())/2 + 18;

        $('#bottomToolbar').css({bottom: bottom + 'px'});
    });

    return my;
}(BottomToolbar || {}));

module.exports = BottomToolbar;
