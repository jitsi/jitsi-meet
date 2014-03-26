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
            if (event.keyCode === 13) {
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
            if (event.keyCode === 13) {
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

        if (connection.emuc.myroomjid === from) {
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

        var chatSize = (chatspace.is(":visible")) ? [0, 0] : Chat.getChatSize();
        var videospaceWidth = window.innerWidth - chatSize[0];
        var videospaceHeight = window.innerHeight;
        var videoSize
            = getVideoSize(null, null, videospaceWidth, videospaceHeight);
        var videoWidth = videoSize[0];
        var videoHeight = videoSize[1];
        var videoPosition = getVideoPosition(   videoWidth,
                                                videoHeight,
                                                videospaceWidth,
                                                videospaceHeight);
        var horizontalIndent = videoPosition[0];
        var verticalIndent = videoPosition[1];

        if (chatspace.is(":visible")) {
            videospace.animate( {right: chatSize[0],
                                width: videospaceWidth,
                                height: videospaceHeight},
                                {queue: false,
                                duration: 500});

            $('#largeVideoContainer').animate({ width: videospaceWidth,
                                                height: videospaceHeight},
                                                {queue: false,
                                                 duration: 500
                                                });

            $('#largeVideo').animate({  width: videoWidth,
                                        height: videoHeight,
                                        top: verticalIndent,
                                        bottom: verticalIndent,
                                        left: horizontalIndent,
                                        right: horizontalIndent},
                                        {   queue: false,
                                            duration: 500
                                        });

            $('#chatspace').hide("slide", { direction: "right",
                                            queue: false,
                                            duration: 500});
        }
        else {
            videospace.animate({right: chatSize[0],
                                width: videospaceWidth,
                                height: videospaceHeight},
                               {queue: false,
                                duration: 500,
                                complete: function() {
                                    scrollChatToBottom();
                                    chatspace.trigger('shown');
                                }
                               });

            $('#largeVideoContainer').animate({ width: videospaceWidth,
                                                height: videospaceHeight},
                                                {queue: false,
                                                 duration: 500
                                                });

            $('#largeVideo').animate({  width: videoWidth,
                                        height: videoHeight,
                                        top: verticalIndent,
                                        bottom: verticalIndent,
                                        left: horizontalIndent,
                                        right: horizontalIndent},
                                        {queue: false,
                                         duration: 500
                                        });

            $('#chatspace').show("slide", { direction: "right",
                                            queue: false,
                                            duration: 500});
        }

        // Request the focus in the nickname field or the chat input field.
        if ($('#nickname').css('visibility') === 'visible')
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
        var chatSize = Chat.getChatSize();

        $('#chatspace').width(chatSize[0]);
        $('#chatspace').height(chatSize[1]);

        resizeChatConversation();
    };

    /**
     * Returns the size of the chat.
     */
    my.getChatSize = function() {
        var availableHeight = window.innerHeight;
        var availableWidth = window.innerWidth;

        var chatWidth = 200;
        if (availableWidth*0.2 < 200)
            chatWidth = availableWidth*0.2;

        return [chatWidth, availableHeight];
    };

    /**
     * Resizes the chat conversation.
     */
    function resizeChatConversation() {
        var usermsgStyleHeight = document.getElementById("usermsg").style.height;
        var usermsgHeight = usermsgStyleHeight
            .substring(0, usermsgStyleHeight.indexOf('px'));

        $('#usermsg').width($('#chatspace').width() - 10);
        $('#chatconversation').width($('#chatspace').width() - 10);
        $('#chatconversation')
            .height(window.innerHeight - 10 - parseInt(usermsgHeight));
    };

    /**
     * Shows/hides a visual notification, indicating that a message has arrived.
     */
    function setVisualNotification(show) {
        var unreadMsgElement = document.getElementById('unreadMessages');

        var glower = $('#chatButton');

        if (unreadMessages) {
            unreadMsgElement.innerHTML = unreadMessages.toString();

            showToolbar();

            var chatButtonElement
                = document.getElementById('chatButton').parentNode;
            var leftIndent = (Util.getTextWidth(chatButtonElement)
                                - Util.getTextWidth(unreadMsgElement))/2;
            var topIndent = (Util.getTextHeight(chatButtonElement)
                                - Util.getTextHeight(unreadMsgElement))/2 - 3;

            unreadMsgElement.setAttribute(
                    'style',
                    'top:' + topIndent
                     + '; left:' + leftIndent +';');

            if (!glower.hasClass('icon-chat-simple')) {
                glower.removeClass('icon-chat');
                glower.addClass('icon-chat-simple');
            }
        }
        else {
            unreadMsgElement.innerHTML = '';
            glower.removeClass('icon-chat-simple');
            glower.addClass('icon-chat');
        }

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
