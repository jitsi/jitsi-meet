/* global APP, $, JitsiMeetJS */
//maps keycode to character, id of popover for given function and function
var shortcuts = {};
function initShortcutHandlers() {
    shortcuts = {
        "ESCAPE": {
            character: "Esc",
            function: function() {
                APP.UI.showKeyboardShortcutsPanel(false);
            }
        },
        "C": {
            character: "C",
            id: "toggleChatPopover",
            function: function() {
                JitsiMeetJS.analytics.sendEvent('shortcut.chat.toggled');
                APP.UI.toggleChat();
            }
        },
        "D": {
            character: "D",
            id: "toggleDesktopSharingPopover",
            function: function () {
                JitsiMeetJS.analytics.sendEvent('shortcut.screen.toggled');
                APP.conference.toggleScreenSharing();
            }
        },
        "F": {
            character: "F",
            id: "filmstripPopover",
            function: function() {
                JitsiMeetJS.analytics.sendEvent('shortcut.film.toggled');
                APP.UI.toggleFilmStrip();
            }
        },
        "M": {
            character: "M",
            id: "mutePopover",
            function: function() {
                JitsiMeetJS.analytics.sendEvent('shortcut.audiomute.toggled');
                APP.conference.toggleAudioMuted();
            }
        },
        "R": {
            character: "R",
            function: function() {
                JitsiMeetJS.analytics.sendEvent('shortcut.raisedhand.toggled');
                APP.conference.maybeToggleRaisedHand();
            }

        },
        "T": {
            character: "T",
            function: function() {
                JitsiMeetJS.analytics.sendEvent('shortcut.talk.clicked');
                APP.conference.muteAudio(true);
            }
        },
        "V": {
            character: "V",
            id: "toggleVideoPopover",
            function: function() {
                JitsiMeetJS.analytics.sendEvent('shortcut.videomute.toggled');
                APP.conference.toggleVideoMuted();
            }
        },
        "?": {
            character: "?",
            function: function(e) {
                JitsiMeetJS.analytics.sendEvent('shortcut.shortcut.help');
                APP.UI.toggleKeyboardShortcutsPanel();
            }
        }
    };
}

var KeyboardShortcut = {
    init: function () {
        initShortcutHandlers();
        var self = this;
        window.onkeyup = function(e) {
            var key = self.getKeyboardKey(e).toUpperCase();
            var num = parseInt(key, 10);
            if(!($(":focus").is("input[type=text]") ||
                $(":focus").is("input[type=password]") ||
                $(":focus").is("textarea"))) {
                if (shortcuts.hasOwnProperty(key)) {
                    shortcuts[key].function(e);
                }
                else if (!isNaN(num) && num >= 0 && num <= 9) {
                    APP.UI.clickOnVideo(num + 1);
                }
            //esc while the smileys are visible hides them
            } else if (key === "ESCAPE" &&
                $('#smileysContainer').is(':visible')) {
                APP.UI.toggleSmileys();
            }
        };

        window.onkeydown = function(e) {
            if(!($(":focus").is("input[type=text]") ||
                $(":focus").is("input[type=password]") ||
                $(":focus").is("textarea"))) {
                var key = self.getKeyboardKey(e).toUpperCase();
                if(key === "T") {
                    if(APP.conference.isLocalAudioMuted())
                        APP.conference.muteAudio(false);
                }
            }
        };
        $('body').popover({ selector: '[data-toggle=popover]',
            trigger: 'click hover',
            content: function() {
                return this.getAttribute("content") +
                    self.getShortcut(this.getAttribute("shortcut"));
            }
        });
    },
    /**
     *
     * @param id indicates the popover associated with the shortcut
     * @returns {string} the keyboard shortcut used for the id given
     */
    getShortcut: function (id) {
        for (var key in shortcuts) {
            if (shortcuts.hasOwnProperty(key)) {
                if (shortcuts[key].id === id) {
                    return " (" + shortcuts[key].character + ")";
                }
            }
        }
        return "";
    },
    /**
     * @param e a KeyboardEvent
     * @returns {string} e.key or something close if not supported
     */
    getKeyboardKey: function (e) {
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
    }
};

module.exports = KeyboardShortcut;
