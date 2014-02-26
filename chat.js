/**
 * Chat related user interface.
 */
var Chat = (function (my) {
    var notificationInterval = false;
    var unreadMessages = 0;

    /**
     * Initializes chat related interface.
     */
    my.init = function () {
        var storedDisplayName = window.localStorage.displayname;
        if (storedDisplayName) {
            nickname = storedDisplayName;

            Chat.setChatConversationMode(true);
        }

        $('#nickinput').keydown(function(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                var val = Util.escapeHtml(this.value);
                this.value = '';
                if (!nickname) {
                    nickname = val;
                    window.localStorage.displayname = nickname;

                    connection.emuc.addDisplayNameToPresence(nickname);
                    connection.emuc.sendPresence();

                    Chat.setChatConversationMode(true);

                    return;
                }
            }
        });

        $('#usermsg').keydown(function(event) {
            if (event.keyCode == 13) {
                event.preventDefault();
                var message = Util.escapeHtml(this.value);
                $('#usermsg').val('').trigger('autosize.resize');
                this.focus();
                connection.emuc.sendMessage(message, nickname);
            }
        });

        var onTextAreaResize = function() {
            resizeChatConversation();
            scrollChatToBottom();
        };
        $('#usermsg').autosize({callback: onTextAreaResize});

        $("#chatspace").bind("shown",
            function() {
                unreadMessages = 0;
                setVisualNotification(false);
            });
    };

    /**
     * Appends the given message to the chat conversation.
     */
    my.updateChatConversation = function (from, displayName, message) {
        var divClassName = '';

        if (connection.emuc.myroomjid == from) {
            divClassName = "localuser";
        }
        else {
            divClassName = "remoteuser";

            if (!$('#chatspace').is(":visible")) {
                unreadMessages++;
                Util.playSoundNotification('chatNotification');
                setVisualNotification(true);
            }
        }

        //replace links and smileys
        var escMessage = Util.escapeHtml(message);
        var escDisplayName = Util.escapeHtml(displayName);
        message = processReplacements(escMessage);

        $('#chatconversation').append('<div class="' + divClassName + '"><b>'
                                        + escDisplayName + ': </b>'
                                        + message + '</div>');
        $('#chatconversation').animate(
                { scrollTop: $('#chatconversation')[0].scrollHeight}, 1000);
    };

    /**
     * Opens / closes the chat area.
     */
    my.toggleChat = function () {
        var chatspace = $('#chatspace');
        var videospace = $('#videospace');

        var onShow = function () {
            resizeLarge();
            $('#chatspace').show("slide", { direction: "right", duration: 500});
        };
        var onHide = function () {
            $('#chatspace').hide("slide", { direction: "right", duration: 500});
            resizeLarge();
        };

        if (chatspace.is(":visible")) {
            videospace.animate( {right: 0},
                                {queue: false,
                                duration: 500,
                                progress: onHide});
        }
        else {
            videospace.animate({right: chatspace.width()},
                               {queue: false,
                                duration: 500,
                                progress: onShow,
                                complete: function() {
                                    scrollChatToBottom();
                                    chatspace.trigger('shown');
                                }
                               });
        }

        // Request the focus in the nickname field or the chat input field.
        if ($('#nickname').css('visibility') == 'visible')
            $('#nickinput').focus();
        else {
            $('#usermsg').focus();
        }
    };

    /**
     * Sets the chat conversation mode.
     */
    my.setChatConversationMode = function (isConversationMode) {
        if (isConversationMode) {
            $('#nickname').css({visibility:"hidden"});
            $('#chatconversation').css({visibility:'visible'});
            $('#usermsg').css({visibility:'visible'});
            $('#usermsg').focus();
        }
    };

    /**
     * Resizes the chat area.
     */
    my.resizeChat = function () {
        var availableHeight = window.innerHeight;
        var availableWidth = window.innerWidth;

        var chatWidth = 200;
        if (availableWidth*0.2 < 200)
            chatWidth = availableWidth*0.2;

        $('#chatspace').width(chatWidth);
        $('#chatspace').height(availableHeight - 40);

        resizeChatConversation();
    };

    /**
     * Resizes the chat conversation.
     */
    function resizeChatConversation() {
        var usermsgStyleHeight = document.getElementById("usermsg").style.height;
        var usermsgHeight = usermsgStyleHeight
            .substring(0, usermsgStyleHeight.indexOf('px'));

        $('#chatconversation').width($('#chatspace').width() - 10);
        $('#chatconversation')
            .height(window.innerHeight - 50 - parseInt(usermsgHeight));
    };

    /**
     * Shows/hides a visual notification, indicating that a message has arrived.
     */
    function setVisualNotification(show) {
        var unreadMsgElement = document.getElementById('unreadMessages');

        if (unreadMessages) {
            unreadMsgElement.innerHTML = unreadMessages.toString();

            var chatButtonElement
                = document.getElementById('chat').parentNode;
            var leftIndent = (Util.getTextWidth(chatButtonElement)
                                - Util.getTextWidth(unreadMsgElement) - 5)/2;
            var topIndent = (Util.getTextHeight(chatButtonElement)
                                - Util.getTextHeight(unreadMsgElement))/2 - 2;

            unreadMsgElement.setAttribute(
                    'style',
                    'top:' + topIndent
                     + '; left:' + leftIndent +';');
        }
        else
            unreadMsgElement.innerHTML = '';

        var glower = $('#chat');

        if (show && !notificationInterval) {
            notificationInterval = window.setInterval(function() {
                glower.toggleClass('active');
            }, 800);
        }
        else if (!show && notificationInterval) {
            window.clearInterval(notificationInterval);
            notificationInterval = false;
            glower.removeClass('active');
        }
    }

    /**
     * Scrolls chat to the bottom.
     */
    function scrollChatToBottom() {
        setTimeout(function() {
            $('#chatconversation').scrollTop(
                    $('#chatconversation')[0].scrollHeight);
        }, 5);
    }

    return my;
}(Chat || {}));