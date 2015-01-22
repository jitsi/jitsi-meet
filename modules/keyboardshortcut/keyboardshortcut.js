//maps keycode to character, id of popover for given function and function
var shortcuts = {
    67: {
        character: "C",
        id: "toggleChatPopover",
        function: UI.toggleChat
    },
    70: {
        character: "F",
        id: "filmstripPopover",
        function: UI.toggleFilmStrip
    },
    77: {
        character: "M",
        id: "mutePopover",
        function: UI.toggleAudio
    },
    84: {
        character: "T",
        function: function() {
            if(!RTC.localAudio.isMuted()) {
                UI.toggleAudio();
            }
        }
    },
    86: {
        character: "V",
        id: "toggleVideoPopover",
        function: UI.toggleVideo
    }
};


var KeyboardShortcut = {
    init: function () {
        window.onkeyup = function(e) {
            var keycode = e.which;
            if(!($(":focus").is("input[type=text]") ||
                $(":focus").is("input[type=password]") ||
                $(":focus").is("textarea"))) {
                if (typeof shortcuts[keycode] === "object") {
                    shortcuts[keycode].function();
                }
                else if (keycode >= "0".charCodeAt(0) &&
                    keycode <= "9".charCodeAt(0)) {
                    UI.clickOnVideo(keycode - "0".charCodeAt(0) + 1);
                }
                //esc while the smileys are visible hides them
            } else if (keycode === 27 && $('#smileysContainer').is(':visible')) {
                UI.toggleSmileys();
            }
        };

        window.onkeydown = function(e) {
            if(!($(":focus").is("input[type=text]") ||
                $(":focus").is("input[type=password]") ||
                $(":focus").is("textarea"))) {
                if(e.which === "T".charCodeAt(0)) {
                    if(RTC.localAudio.isMuted()) {
                        UI.toggleAudio();
                    }
                }
            }
        };
    },
    /**
     *
     * @param id indicates the popover associated with the shortcut
     * @returns {string} the keyboard shortcut used for the id given
     */
    getShortcut: function (id) {
        for (var keycode in shortcuts) {
            if (shortcuts.hasOwnProperty(keycode)) {
                if (shortcuts[keycode].id === id) {
                    return " (" + shortcuts[keycode].character + ")";
                }
            }
        }
        return "";
    }
};

module.exports = KeyboardShortcut;
