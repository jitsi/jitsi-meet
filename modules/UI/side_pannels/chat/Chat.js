/* global APP, $ */

import {processReplacements, linkify} from './Replacement';
import CommandsProcessor from './Commands';
import VideoLayout from "../../videolayout/VideoLayout";

import UIUtil from '../../util/UIUtil';
import UIEvents from '../../../../service/UI/UIEvents';

import { smileys } from './smileys';

import { dockToolbox, setSubject } from '../../../../react/features/toolbox';

let unreadMessages = 0;
const sidePanelsContainerId = 'sideToolbarContainer';
const htmlStr = `
    <div id="chat_container" class="sideToolbarContainer__inner">
        <div id="nickname">
            <span data-i18n="chat.nickname.title"></span>
            <form>
                <input type='text'
                       class="input-control" id="nickinput" autofocus
                    data-i18n="[placeholder]chat.nickname.popover">
            </form>
        </div>

        <div id="chatconversation"></div>
        <audio id="chatNotification" src="sounds/incomingMessage.wav"
            preload="auto"></audio>
        <textarea id="usermsg" autofocus
            data-i18n="[placeholder]chat.messagebox"></textarea>
        <div id="smileysarea">
            <div id="smileys">
                <img src="images/smile.svg"/>
            </div>
        </div>
    </div>`;

function initHTML() {
    $(`#${sidePanelsContainerId}`)
        .append(htmlStr);
}

/**
 * The container id, which is and the element id.
 */
var CHAT_CONTAINER_ID = "chat_container";

/**
 *  Updates visual notification, indicating that a message has arrived.
 */
function updateVisualNotification() {
    // XXX The rewrite of the toolbar in React delayed the availability of the
    // element unreadMessages. In order to work around the delay, I introduced
    // and utilized unreadMsgSelector in addition to unreadMsgElement.
    const unreadMsgSelector = $('#unreadMessages');
    const unreadMsgElement
        = unreadMsgSelector.length > 0 ? unreadMsgSelector[0] : undefined;

    if (unreadMessages) {
        unreadMsgElement.innerHTML = unreadMessages.toString();

        APP.store.dispatch(dockToolbox(true));

        const chatButtonElement
            = document.getElementById('toolbar_button_chat');
        const leftIndent
            = (UIUtil.getTextWidth(chatButtonElement)
                    - UIUtil.getTextWidth(unreadMsgElement))
                / 2;
        const topIndent
            = (UIUtil.getTextHeight(chatButtonElement)
                        - UIUtil.getTextHeight(unreadMsgElement))
                    / 2
                - 5;

        unreadMsgElement.setAttribute(
                'style',
                'top:' + topIndent + '; left:' + leftIndent + ';');
    }
    else {
        unreadMsgSelector.html('');
    }

    if (unreadMsgElement) {
        unreadMsgSelector.parent()[unreadMessages > 0 ? 'show' : 'hide']();
    }
}


/**
 * Returns the current time in the format it is shown to the user
 * @returns {string}
 */
function getCurrentTime(stamp) {
    var now     = (stamp? new Date(stamp): new Date());
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds();
    if(hour.toString().length === 1) {
        hour = '0'+hour;
    }
    if(minute.toString().length === 1) {
        minute = '0'+minute;
    }
    if(second.toString().length === 1) {
        second = '0'+second;
    }
    return hour+':'+minute+':'+second;
}

function toggleSmileys() {
    var smileys = $('#smileysContainer');
    if(!smileys.is(':visible')) {
        smileys.show("slide", { direction: "down", duration: 300});
    } else {
        smileys.hide("slide", { direction: "down", duration: 300});
    }
    $('#usermsg').focus();
}

function addClickFunction(smiley, number) {
    smiley.onclick = function addSmileyToMessage() {
        var usermsg = $('#usermsg');
        var message = usermsg.val();
        message += smileys['smiley' + number];
        usermsg.val(message);
        usermsg.get(0).setSelectionRange(message.length, message.length);
        toggleSmileys();
        usermsg.focus();
    };
}

/**
 * Adds the smileys container to the chat
 */
function addSmileys() {
    var smileysContainer = document.createElement('div');
    smileysContainer.id = 'smileysContainer';
    for(var i = 1; i <= 21; i++) {
        var smileyContainer = document.createElement('div');
        smileyContainer.id = 'smiley' + i;
        smileyContainer.className = 'smileyContainer';
        var smiley = document.createElement('img');
        smiley.src = 'images/smileys/smiley' + i + '.svg';
        smiley.className =  'smiley';
        addClickFunction(smiley, i);
        smileyContainer.appendChild(smiley);
        smileysContainer.appendChild(smileyContainer);
    }

    $("#chat_container").append(smileysContainer);
}

/**
 * Resizes the chat conversation.
 */
function resizeChatConversation() {
    var msgareaHeight = $('#usermsg').outerHeight();
    var chatspace = $('#' + CHAT_CONTAINER_ID);
    var width = chatspace.width();
    var chat = $('#chatconversation');
    var smileys = $('#smileysarea');

    smileys.height(msgareaHeight);
    $("#smileys").css('bottom', (msgareaHeight - 26) / 2);
    $('#smileysContainer').css('bottom', msgareaHeight);
    chat.width(width - 10);
    chat.height(window.innerHeight - 15 - msgareaHeight);
}

/**
 * Focus input after 400 ms
 * Found input by id
 *
 * @param id {string} input id
 */
function deferredFocus(id){
    setTimeout(() => $(`#${id}`).focus(), 400);
}
/**
 * Chat related user interface.
 */
var Chat = {
    /**
     * Initializes chat related interface.
     */
    init (eventEmitter) {
        initHTML();
        if (APP.settings.getDisplayName()) {
            Chat.setChatConversationMode(true);
        }

        $("#smileys").click(function() {
            Chat.toggleSmileys();
        });

        $('#nickinput').keydown(function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                let val = this.value;
                this.value = '';
                eventEmitter.emit(UIEvents.NICKNAME_CHANGED, val);
                deferredFocus('usermsg');
            }
        });

        var usermsg = $('#usermsg');
        usermsg.keydown(function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                var value = this.value;
                usermsg.val('').trigger('autosize.resize');
                this.focus();
                var command = new CommandsProcessor(value, eventEmitter);
                if (command.isCommand()) {
                    command.processCommand();
                } else {
                    var message = UIUtil.escapeHtml(value);
                    eventEmitter.emit(UIEvents.MESSAGE_CREATED, message);
                }
            }
        });

        var onTextAreaResize = function () {
            resizeChatConversation();
            Chat.scrollChatToBottom();
        };
        usermsg.autosize({callback: onTextAreaResize});

        eventEmitter.on(UIEvents.SIDE_TOOLBAR_CONTAINER_TOGGLED,
            function(containerId, isVisible) {
                if (containerId !== CHAT_CONTAINER_ID || !isVisible)
                    return;

                unreadMessages = 0;
                updateVisualNotification();

                // Undock the toolbar when the chat is shown and if we're in a
                // video mode.
                if (VideoLayout.isLargeVideoVisible()) {
                    APP.store.dispatch(dockToolbox(false));
                }

                // if we are in conversation mode focus on the text input
                // if we are not, focus on the display name input
                if (APP.settings.getDisplayName())
                    deferredFocus('usermsg');
                else
                    deferredFocus('nickinput');
            });

        addSmileys();
        updateVisualNotification();
    },

    /**
     * Appends the given message to the chat conversation.
     */
    updateChatConversation (id, displayName, message, stamp) {
        var divClassName = '';

        if (APP.conference.isLocalId(id)) {
            divClassName = "localuser";
        } else {
            divClassName = "remoteuser";

            if (!Chat.isVisible()) {
                unreadMessages++;
                UIUtil.playSoundNotification('chatNotification');
                updateVisualNotification();
            }
        }

        // replace links and smileys
        // Strophe already escapes special symbols on sending,
        // so we escape here only tags to avoid double &amp;
        var escMessage = message.replace(/</g, '&lt;').
            replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
        var escDisplayName = UIUtil.escapeHtml(displayName);
        message = processReplacements(escMessage);

        var messageContainer =
            '<div class="chatmessage">'+
                '<img src="images/chatArrow.svg" class="chatArrow">' +
                '<div class="username ' + divClassName +'">' + escDisplayName +
                '</div>' + '<div class="timestamp">' + getCurrentTime(stamp) +
                '</div>' + '<div class="usermessage">' + message + '</div>' +
            '</div>';

        $('#chatconversation').append(messageContainer);
        $('#chatconversation').animate(
                { scrollTop: $('#chatconversation')[0].scrollHeight}, 1000);
    },

    /**
     * Appends error message to the conversation
     * @param errorMessage the received error message.
     * @param originalText the original message.
     */
    chatAddError (errorMessage, originalText) {
        errorMessage = UIUtil.escapeHtml(errorMessage);
        originalText = UIUtil.escapeHtml(originalText);

        $('#chatconversation').append(
            '<div class="errorMessage"><b>Error: </b>' + 'Your message' +
            (originalText? (' \"'+ originalText + '\"') : "") +
            ' was not sent.' +
            (errorMessage? (' Reason: ' + errorMessage) : '') +  '</div>');
        $('#chatconversation').animate(
            { scrollTop: $('#chatconversation')[0].scrollHeight}, 1000);
    },

    /**
     * Sets the subject to the UI
     * @param subject the subject
     */
    setSubject (subject) {
        if (subject) {
            subject = subject.trim();
        }

        const html = linkify(UIUtil.escapeHtml(subject));

        APP.store.dispatch(setSubject(html));
    },

    /**
     * Sets the chat conversation mode.
     * Conversation mode is the normal chat mode, non conversation mode is
     * where we ask user to input its display name.
     * @param {boolean} isConversationMode if chat should be in
     * conversation mode or not.
     */
    setChatConversationMode (isConversationMode) {
        $('#' + CHAT_CONTAINER_ID)
            .toggleClass('is-conversation-mode', isConversationMode);
    },

    /**
     * Resizes the chat area.
     */
    resizeChat (width, height) {
        $('#' + CHAT_CONTAINER_ID).width(width).height(height);

        resizeChatConversation();
    },

    /**
     * Indicates if the chat is currently visible.
     */
    isVisible () {
        return UIUtil.isVisible(
            document.getElementById(CHAT_CONTAINER_ID));
    },
    /**
     * Shows and hides the window with the smileys
     */
    toggleSmileys,

    /**
     * Scrolls chat to the bottom.
     */
    scrollChatToBottom () {
        setTimeout(
            () => {
                const chatconversation = $('#chatconversation');

                // XXX Prevent TypeError: undefined is not an object when the
                // Web browser does not support WebRTC (yet).
                chatconversation.length > 0
                    && chatconversation.scrollTop(
                            chatconversation[0].scrollHeight);
            },
            5);
    }
};

export default Chat;
