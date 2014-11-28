/* global $, interfaceConfig, Moderator, showDesktopSharingButton */
var ToolbarToggler = (function (my) {
    var toolbarTimeoutObject,
        toolbarTimeout = interfaceConfig.INITIAL_TOOLBAR_TIMEOUT;

    /**
     * Shows the main toolbar.
     */
    my.showToolbar = function () {
        var header = $("#header"),
            bottomToolbar = $("#bottomToolbar");
        if (!header.is(':visible') || !bottomToolbar.is(":visible")) {
            header.show("slide", { direction: "up", duration: 300});
            $('#subject').animate({top: "+=40"}, 300);
            if (!bottomToolbar.is(":visible")) {
                bottomToolbar.show(
                    "slide", {direction: "right", duration: 300});
            }

            if (toolbarTimeoutObject) {
                clearTimeout(toolbarTimeoutObject);
                toolbarTimeoutObject = null;
            }
            toolbarTimeoutObject = setTimeout(hideToolbar, toolbarTimeout);
            toolbarTimeout = interfaceConfig.TOOLBAR_TIMEOUT;
        }

        if (Moderator.isModerator())
        {
//            TODO: Enable settings functionality.
//                  Need to uncomment the settings button in index.html.
//            $('#settingsButton').css({visibility:"visible"});
        }

        // Show/hide desktop sharing button
        showDesktopSharingButton();
    };

    /**
     * Hides the toolbar.
     */
    var hideToolbar = function () {
        var header = $("#header"),
            bottomToolbar = $("#bottomToolbar");
        var isToolbarHover = false;
        header.find('*').each(function () {
            var id = $(this).attr('id');
            if ($("#" + id + ":hover").length > 0) {
                isToolbarHover = true;
            }
        });
        if ($("#bottomToolbar:hover").length > 0) {
            isToolbarHover = true;
        }

        clearTimeout(toolbarTimeoutObject);
        toolbarTimeoutObject = null;

        if (!isToolbarHover) {
            header.hide("slide", { direction: "up", duration: 300});
            $('#subject').animate({top: "-=40"}, 300);
            if ($("#remoteVideos").hasClass("hidden")) {
                bottomToolbar.hide(
                    "slide", {direction: "right", duration: 300});
            }
        }
        else {
            toolbarTimeoutObject = setTimeout(hideToolbar, toolbarTimeout);
        }
    };


    /**
     * Docks/undocks the toolbar.
     *
     * @param isDock indicates what operation to perform
     */
    my.dockToolbar = function (isDock) {
        if (isDock) {
            // First make sure the toolbar is shown.
            if (!$('#header').is(':visible')) {
                ToolbarToggler.showToolbar();
            }

            // Then clear the time out, to dock the toolbar.
            if (toolbarTimeoutObject) {
                clearTimeout(toolbarTimeoutObject);
                toolbarTimeoutObject = null;
            }
        }
        else {
            if (!$('#header').is(':visible')) {
                ToolbarToggler.showToolbar();
            }
            else {
                toolbarTimeoutObject = setTimeout(hideToolbar, toolbarTimeout);
            }
        }
    };


    return my;
}(ToolbarToggler || {}));