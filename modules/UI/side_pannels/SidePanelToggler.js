/* global require, $ */
var Chat = require("./chat/Chat");
var ContactList = require("./contactlist/ContactList");
var Settings = require("./../../settings/Settings");
var SettingsMenu = require("./settings/SettingsMenu");
var VideoLayout = require("../videolayout/VideoLayout");
var ToolbarToggler = require("../toolbars/ToolbarToggler");
var UIUtil = require("../util/UIUtil");
var LargeVideo = require("../videolayout/LargeVideo");

/**
 * Toggler for the chat, contact list, settings menu, etc..
 */
var PanelToggler = (function(my) {

    var currentlyOpen = null;
    var buttons = {
        '#chatspace': '#chatBottomButton',
        '#contactlist': '#contactListButton',
        '#settingsmenu': '#toolbar_button_settings'
    };

    /**
     * Toggles the windows in the side panel
     * @param object the window that should be shown
     * @param selector the selector for the element containing the panel
     * @param onOpenComplete function to be called when the panel is opened
     * @param onOpen function to be called if the window is going to be opened
     * @param onClose function to be called if the window is going to be closed
     */
    var toggle = function(object, selector, onOpenComplete, onOpen, onClose) {
        UIUtil.buttonClick(buttons[selector], "active");

        if (object.isVisible()) {
            $("#toast-container").animate({
                    right: '5px'
                },
                {
                    queue: false,
                    duration: 500
                });
            $(selector).hide("slide", {
                direction: "right",
                queue: false,
                duration: 500
            });
            if(typeof onClose === "function") {
                onClose();
            }

            currentlyOpen = null;
        }
        else {
            // Undock the toolbar when the chat is shown and if we're in a
            // video mode.
            if (LargeVideo.isLargeVideoVisible()) {
                ToolbarToggler.dockToolbar(false);
            }

            if(currentlyOpen) {
                var current = $(currentlyOpen);
                UIUtil.buttonClick(buttons[currentlyOpen], "active");
                current.css('z-index', 4);
                setTimeout(function () {
                    current.css('display', 'none');
                    current.css('z-index', 5);
                }, 500);
            }

            $("#toast-container").animate({
                    right: (PanelToggler.getPanelSize()[0] + 5) + 'px'
                },
                {
                    queue: false,
                    duration: 500
                });
            $(selector).show("slide", {
                direction: "right",
                queue: false,
                duration: 500,
                complete: onOpenComplete
            });
            if(typeof onOpen === "function") {
                onOpen();
            }

            currentlyOpen = selector;
        }
    };

    /**
     * Opens / closes the chat area.
     */
    my.toggleChat = function() {
        var chatCompleteFunction = Chat.isVisible() ?
            function() {} : function () {
            Chat.scrollChatToBottom();
            $('#chatspace').trigger('shown');
        };

        VideoLayout.resizeVideoArea(!Chat.isVisible(), chatCompleteFunction);

        toggle(Chat,
            '#chatspace',
            function () {
                // Request the focus in the nickname field or the chat input field.
                if ($('#nickname').css('visibility') === 'visible') {
                    $('#nickinput').focus();
                } else {
                    $('#usermsg').focus();
                }
            },
            null,
            Chat.resizeChat,
            null);
    };

    /**
     * Opens / closes the contact list area.
     */
    my.toggleContactList = function () {
        var completeFunction = ContactList.isVisible() ?
            function() {} : function () { $('#contactlist').trigger('shown');};
        VideoLayout.resizeVideoArea(!ContactList.isVisible(), completeFunction);

        toggle(ContactList,
            '#contactlist',
            null,
            function() {
                ContactList.setVisualNotification(false);
            },
            null);
    };

    /**
     * Opens / closes the settings menu
     */
    my.toggleSettingsMenu = function() {
        VideoLayout.resizeVideoArea(!SettingsMenu.isVisible(), function (){});
        toggle(SettingsMenu,
            '#settingsmenu',
            null,
            function() {
                var settings = Settings.getSettings();
                $('#setDisplayName').get(0).value = settings.displayName;
                $('#setEmail').get(0).value = settings.email;
            },
            null);
    };

    /**
     * Returns the size of the side panel.
     */
    my.getPanelSize = function () {
        var availableHeight = window.innerHeight;
        var availableWidth = window.innerWidth;

        var panelWidth = 200;
        if (availableWidth * 0.2 < 200) {
            panelWidth = availableWidth * 0.2;
        }

        return [panelWidth, availableHeight];
    };

    my.isVisible = function() {
        return (Chat.isVisible() || ContactList.isVisible() || SettingsMenu.isVisible());
    };

    return my;

}(PanelToggler || {}));

module.exports = PanelToggler;