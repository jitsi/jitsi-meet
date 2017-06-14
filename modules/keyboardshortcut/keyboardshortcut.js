/* global APP, $, JitsiMeetJS, interfaceConfig */

import { toggleDialog } from '../../react/features/base/dialog';
import { SpeakerStats } from '../../react/features/speaker-stats';

/**
 * The reference to the shortcut dialogs when opened.
 */
let keyboardShortcutDialog = null;

/**
 * Initialise global shortcuts.
 * Global shortcuts are shortcuts for features that don't have a button or
 * link associated with the action. In other words they represent actions
 * triggered _only_ with a shortcut.
 */
function initGlobalShortcuts() {
    KeyboardShortcut.registerShortcut("ESCAPE", null, function() {
        showKeyboardShortcutsPanel(false);
    });

    KeyboardShortcut.registerShortcut("?", null, function() {
        JitsiMeetJS.analytics.sendEvent("shortcut.shortcut.help");
        showKeyboardShortcutsPanel(true);
    }, "keyboardShortcuts.toggleShortcuts");

    // register SPACE shortcut in two steps to insure visibility of help message
    KeyboardShortcut.registerShortcut(" ", null, function() {
        JitsiMeetJS.analytics.sendEvent("shortcut.talk.clicked");
        APP.conference.muteAudio(true);
    });
    KeyboardShortcut._addShortcutToHelp("SPACE","keyboardShortcuts.pushToTalk");

    if(!interfaceConfig.filmStripOnly) {
        KeyboardShortcut.registerShortcut("T", null, () => {
            JitsiMeetJS.analytics.sendEvent("shortcut.speakerStats.clicked");
            APP.store.dispatch(toggleDialog(SpeakerStats, {
                conference: APP.conference
            }));
        }, "keyboardShortcuts.showSpeakerStats");
    }

    /**
     * FIXME: Currently focus keys are directly implemented below in onkeyup.
     * They should be moved to the SmallVideo instead.
     */
    KeyboardShortcut._addShortcutToHelp("0", "keyboardShortcuts.focusLocal");
    KeyboardShortcut._addShortcutToHelp("1-9", "keyboardShortcuts.focusRemote");
}

/**
 * Shows or hides the keyboard shortcuts dialog.
 * @param {boolean} show whether to show or hide the dialog
 */
function showKeyboardShortcutsPanel(show) {
    if (show
            && !APP.UI.messageHandler.isDialogOpened()
            && keyboardShortcutDialog === null) {
        let msg = $('#keyboard-shortcuts').html();
        let buttons = { Close: true };

        keyboardShortcutDialog = APP.UI.messageHandler.openDialog(
            'keyboardShortcuts.keyboardShortcuts', msg, true, buttons);
    } else if (keyboardShortcutDialog !== null) {
        keyboardShortcutDialog.close();
        keyboardShortcutDialog = null;
    }
}

/**
 * Map of shortcuts. When a shortcut is registered it enters the mapping.
 * @type {{}}
 */
let _shortcuts = {};

/**
 * True if the keyboard shortcuts are enabled and false if not.
 * @type {boolean}
 */
let enabled = true;

/**
 * Maps keycode to character, id of popover for given function and function.
 */
const KeyboardShortcut = {
    init: function () {
        initGlobalShortcuts();

        var self = this;
        window.onkeyup = function(e) {
            if(!enabled) {
                return;
            }
            var key = self._getKeyboardKey(e).toUpperCase();
            var num = parseInt(key, 10);
            if(!($(":focus").is("input[type=text]") ||
                $(":focus").is("input[type=password]") ||
                $(":focus").is("textarea"))) {
                if (_shortcuts.hasOwnProperty(key)) {
                    _shortcuts[key].function(e);
                }
                else if (!isNaN(num) && num >= 0 && num <= 9) {
                    APP.UI.clickOnVideo(num);
                }
            //esc while the smileys are visible hides them
            } else if (key === "ESCAPE" &&
                $('#smileysContainer').is(':visible')) {
                APP.UI.toggleSmileys();
            }
        };

        window.onkeydown = function(e) {
            if(!enabled) {
                return;
            }
            if(!($(":focus").is("input[type=text]") ||
                $(":focus").is("input[type=password]") ||
                $(":focus").is("textarea"))) {
                var key = self._getKeyboardKey(e).toUpperCase();
                if(key === " ") {
                    if(APP.conference.isLocalAudioMuted())
                        APP.conference.muteAudio(false);
                }
            }
        };
    },

    /**
     * Enables/Disables the keyboard shortcuts.
     * @param {boolean} value - the new value.
     */
    enable: function (value) {
        enabled = value;
    },

    /**
     * Registers a new shortcut.
     *
     * @param shortcutChar the shortcut character triggering the action
     * @param shortcutAttr the "shortcut" html element attribute mappring an
     * element to this shortcut and used to show the shortcut character on the
     * element tooltip
     * @param exec the function to be executed when the shortcut is pressed
     * @param helpDescription the description of the shortcut that would appear
     * in the help menu
     */
    registerShortcut: function( shortcutChar,
                                shortcutAttr,
                                exec,
                                helpDescription) {
        _shortcuts[shortcutChar] = {
            character: shortcutChar,
            shortcutAttr: shortcutAttr,
            function: exec
        };

        if (helpDescription)
            this._addShortcutToHelp(shortcutChar, helpDescription);
    },

    /**
     * Unregisters a shortcut.
     *
     * @param shortcutChar unregisters the given shortcut, which means it will
     * no longer be usable
     */
    unregisterShortcut: function(shortcutChar) {
        _shortcuts.remove(shortcutChar);

        this._removeShortcutFromHelp(shortcutChar);
    },

    /**
     * Returns the tooltip string for the given shortcut attribute.
     *
     * @param shortcutAttr indicates the popover associated with the shortcut
     * @returns {string} the tooltip string to add to the given shortcut popover
     * or an empty string if the shortcutAttr is null, an empty string or not
     * found in the shortcut mapping
     */
    getShortcutTooltip: function (shortcutAttr) {
        if (typeof shortcutAttr === "string" && shortcutAttr.length > 0) {
            for (var key in _shortcuts) {
                if (_shortcuts.hasOwnProperty(key)
                    && _shortcuts[key].shortcutAttr
                    && _shortcuts[key].shortcutAttr === shortcutAttr) {
                    return " (" + _shortcuts[key].character + ")";
                }
            }
        }

        return "";
    },
    /**
     * @param e a KeyboardEvent
     * @returns {string} e.key or something close if not supported
     */
    _getKeyboardKey: function (e) {
        if (typeof e.key === "string") {
            return e.key;
        }
        if (e.type === "keypress" && (
                (e.which >= 32 && e.which <= 126) ||
                (e.which >= 160 && e.which <= 255) )) {
            return String.fromCharCode(e.which);
        }
        // try to fallback (0-9A-Za-z and QWERTY keyboard)
        switch (e.which) {
        case 27:
            return "Escape";
        case 191:
            return e.shiftKey ? "?" : "/";
        }
        if (e.shiftKey || e.type === "keypress") {
            return String.fromCharCode(e.which);
        } else {
            return String.fromCharCode(e.which).toLowerCase();
        }
    },

    /**
     * Adds the given shortcut to the help dialog.
     *
     * @param shortcutChar the shortcut character
     * @param shortcutDescriptionKey the description of the shortcut
     * @private
     */
    _addShortcutToHelp: function (shortcutChar, shortcutDescriptionKey) {

        let listElement = document.createElement("li");
        let itemClass = 'shortcuts-list__item';
        listElement.className = itemClass;
        listElement.id = shortcutChar;

        let spanElement = document.createElement("span");
        spanElement.className = "item-action";

        let kbdElement = document.createElement("kbd");
        let classes = 'aui-label regular-key';
        kbdElement.className = classes;
        kbdElement.innerHTML = shortcutChar;
        spanElement.appendChild(kbdElement);

        let descriptionElement = document.createElement("span");
        let descriptionClass = "shortcuts-list__description";
        descriptionElement.className = descriptionClass;
        descriptionElement.setAttribute("data-i18n", shortcutDescriptionKey);
        APP.translation.translateElement($(descriptionElement));

        listElement.appendChild(spanElement);
        listElement.appendChild(descriptionElement);

        let parentListElement
            = document.getElementById("keyboard-shortcuts-list");

        if (parentListElement)
            parentListElement.appendChild(listElement);
    },

    /**
     * Removes the list element corresponding to the given shortcut from the
     * help dialog
     * @private
     */
    _removeShortcutFromHelp: function (shortcutChar) {
        var parentListElement
            = document.getElementById("keyboard-shortcuts-list");

        var shortcutElement = document.getElementById(shortcutChar);

        if (shortcutElement)
            parentListElement.removeChild(shortcutElement);
    }
};

export default KeyboardShortcut;
