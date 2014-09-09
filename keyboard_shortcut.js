var KeyboardShortcut = (function(my) {
    var shortcuts = {
        67: {
            character: "C",
            id: "toggleChatPopover",
            function: BottomToolbar.toggleChat
        },
        70: {
            character: "F",
            id: "filmstripPopover",
            function: BottomToolbar.toggleFilmStrip
        },
        77: {
            character: "M",
            id: "mutePopover",
            function: toggleAudio
        },
        84: {
            character: "T",
            function: function() {
                if(!isAudioMuted()) {
                    toggleAudio();
                }
            }
        },
        86: {
            character: "V",
            id: "toggleVideoPopover",
            function: toggleVideo
        }
    };

    window.onkeyup = function(e) {
        if($("#chatspace").css("display") === "none") {
            var keycode = e.which;
            if (typeof shortcuts[keycode] === "object") {
                shortcuts[keycode].function();
            } else if (keycode >= 49 && keycode <= 57) {
                var remoteVideos = $(".videocontainer:not(#mixedstream)"),
                    videoWanted = keycode - 48;
                if (remoteVideos.length > videoWanted) {
                    remoteVideos[videoWanted].click();
                }
            }
        }
    };

    window.onkeydown = function(e) {
        if($("#chatspace").css("display") === "none") {
            if(e.which === 84) {
                if(isAudioMuted()) {
                    toggleAudio();
                }
            }
        }
    };
    /**
     *  
     * @param id indicates the popover associated with the shortcut
     * @returns {string} the keyboard shortcut used for the id given
     */
    my.getShortcut = function(id) {
        for(var keycode in shortcuts) {
            if(shortcuts.hasOwnProperty(keycode)) {
                if (shortcuts[keycode].id === id) {
                    return " (" + shortcuts[keycode].character + ")";
                }
            }
        }
        return "";
    };
    return my;
}(KeyboardShortcut || {}));
