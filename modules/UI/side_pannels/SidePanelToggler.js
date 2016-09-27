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
 * @param onVideoResizeComplete function to be called after the video area
 * is resized
 */
function toggle (object, selector, onOpenComplete,
                 onOpen, onClose, onVideoResizeComplete) {
    let isSideBarVisible = object.isVisible();

    UIUtil.buttonClick(buttons[selector], "active");

    if (isSideBarVisible) {
        $("#toast-container").animate({
            right: 5
        }, {
            queue: false,
            duration: 500
        });

        $(selector).hide("slide", {
            direction: "right",
            queue: false,
            duration: 500,
            // Set the size to 0 at the end of the animation to ensure that
            // the is(":visible") function on this selector will return {false}
            // when the element is hidden.
            complete: function() {$(selector).css("width", "0");}
        });

        resizeVideoArea(false, onVideoResizeComplete);

        if(typeof onClose === "function") {
            onClose();
        }

        currentlyOpen = null;
    } else {
        resizeVideoArea(true, onVideoResizeComplete);

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
        // Set the size dynamically (not in the css), so that we're sure that
        // when is(":visible") is called on this selector the result is {false}
        // before it's actually visible.
        // (Chrome seems to return {true} for an element which is in the DOM and
        // has non-null size set).
        $(selector).css("width", "20%");
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

function resizeVideoArea(isSidePanelVisible, completeFunction) {
    VideoLayout.resizeVideoArea(isSidePanelVisible,
        false,//don't force thumbnail count update
        true, //animate
        completeFunction);
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

        toggle(Chat, //Object
            '#chatspace', // Selector
            function () { //onOpenComplete
                // Request the focus in the nickname field or the chat input
                // field.
                if ($('#nickname').css('visibility') === 'visible') {
                    $('#nickinput').focus();
                } else {
                    $('#usermsg').focus();
                }
            },
            () => this.resizeChat(), //OnOpen
            null,
            chatCompleteFunction); //OnClose
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

        toggle(ContactList,
            '#contactlist',
            null,
            function() {
                ContactList.setVisualNotification(false);
            },
            null,
            completeFunction);
    },

    /**
     * Opens / closes the settings menu
     */
    toggleSettingsMenu () {
        toggle(SettingsMenu,
            '#settingsmenu',
            null,
            function() {},
            null);
    },

    isVisible () {
        return (Chat.isVisible() ||
                ContactList.isVisible() ||
                SettingsMenu.isVisible());
    }
};

export default PanelToggler;
