!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),o.keyboardshortcut=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{}]},{},[1])(1)
});