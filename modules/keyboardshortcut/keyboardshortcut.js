//maps keycode to character, id of popover for given function and function
var shortcuts = {
    67: {
        character: "C",
        id: "toggleChatPopover",
        function: APP.UI.toggleChat
    },
    70: {
        character: "F",
        id: "filmstripPopover",
        function: APP.UI.toggleFilmStrip
    },
    77: {
        character: "M",
        id: "mutePopover",
        function: APP.UI.toggleAudio
    },
    84: {
        character: "T",
        function: function() {
            if(!APP.RTC.localAudio.isMuted()) {
                APP.UI.toggleAudio();
            }
        }
    },
    86: {
        character: "V",
        id: "toggleVideoPopover",
        function: APP.UI.toggleVideo
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
                    APP.UI.clickOnVideo(keycode - "0".charCodeAt(0) + 1);
                }
                //esc while the smileys are visible hides them
            } else if (keycode === 27 && $('#smileysContainer').is(':visible')) {
                APP.UI.toggleSmileys();
            }
        };

        window.onkeydown = function(e) {
            if(!($(":focus").is("input[type=text]") ||
                $(":focus").is("input[type=password]") ||
                $(":focus").is("textarea"))) {
                if(e.which === "T".charCodeAt(0)) {
                    if(APP.RTC.localAudio.isMuted()) {
                        APP.UI.toggleAudio();
                    }
                }
            }
        };
        var self = this;
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
