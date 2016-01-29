/* global require, $ */
import Chat from "./chat/Chat";
import ContactList from "./contactlist/ContactList";
import Settings from "./../../settings/Settings";
import SettingsMenu from "./settings/SettingsMenu";
import VideoLayout from "../videolayout/VideoLayout";
import ToolbarToggler from "../toolbars/ToolbarToggler";
import UIUtil from "../util/UIUtil";

const buttons = {
    '#chatspace': '#chatBottomButton',
    '#contactlist': '#contactListButton',
    '#settingsmenu': '#toolbar_button_settings'
};

var currentlyOpen = null;

/**
 * Toggles the windows in the side panel
 * @param object the window that should be shown
 * @param selector the selector for the element containing the panel
 * @param onOpenComplete function to be called when the panel is opened
 * @param onOpen function to be called if the window is going to be opened
 * @param onClose function to be called if the window is going to be closed
 */
function toggle (object, selector, onOpenComplete, onOpen, onClose) {
    UIUtil.buttonClick(buttons[selector], "active");

    if (object.isVisible()) {
        $("#toast-container").animate({
            right: 5
        }, {
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
    } else {
        // Undock the toolbar when the chat is shown and if we're in a
        // video mode.
        if (VideoLayout.isLargeVideoVisible()) {
            ToolbarToggler.dockToolbar(false);
        }

        if (currentlyOpen) {
            var current = $(currentlyOpen);
            UIUtil.buttonClick(buttons[currentlyOpen], "active");
            current.css('z-index', 4);
            setTimeout(function () {
                current.css('display', 'none');
                current.css('z-index', 5);
            }, 500);
        }

        $("#toast-container").animate({
            right: (UIUtil.getSidePanelSize()[0] + 5)
        }, {
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
}

/**
 * Toggler for the chat, contact list, settings menu, etc..
 */
var PanelToggler = {

    /**
     * Opens / closes the chat area.
     */
    toggleChat () {
        var chatCompleteFunction = Chat.isVisible()
            ? function () {}
            : function () {
                Chat.scrollChatToBottom();
                $('#chatspace').trigger('shown');
            };

        VideoLayout.resizeVideoArea(!Chat.isVisible(), chatCompleteFunction);

        toggle(Chat,
            '#chatspace',
            function () {
                // Request the focus in the nickname field or the chat input
                // field.
                if ($('#nickname').css('visibility') === 'visible') {
                    $('#nickinput').focus();
                } else {
                    $('#usermsg').focus();
                }
            },
            null,
            () => this.resizeChat(),
            null);
    },

    resizeChat () {
        let [width, height] = UIUtil.getSidePanelSize();
        Chat.resizeChat(width, height);
    },

    /**
     * Opens / closes the contact list area.
     */
    toggleContactList () {
        var completeFunction = ContactList.isVisible()
            ? function () {}
            : function () {
                $('#contactlist').trigger('shown');
            };
        VideoLayout.resizeVideoArea(!ContactList.isVisible(), completeFunction);

        toggle(ContactList,
            '#contactlist',
            null,
            function() {
                ContactList.setVisualNotification(false);
            },
            null);
    },

    /**
     * Opens / closes the settings menu
     */
    toggleSettingsMenu () {
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
    },

    isVisible () {
        return (Chat.isVisible() ||
                ContactList.isVisible() ||
                SettingsMenu.isVisible());
    }
};

export default PanelToggler;
