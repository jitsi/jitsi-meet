/* @flow */

import React from 'react';

declare var APP: Object;
declare var JitsiMeetJS: Object;

/**
 * All toolbars buttons description
 */
const defaultToolbarButtons = {
    'microphone': {
        id: 'toolbar_button_mute',
        tooltipKey: 'toolbar.mute',
        className: 'button icon-microphone',
        shortcut: 'M',
        shortcutAttr: 'mutePopover',
        shortcutFunc() {
            JitsiMeetJS.analytics.sendEvent('shortcut.audiomute.toggled');
            APP.conference.toggleAudioMuted();
        },
        shortcutDescription: 'keyboardShortcuts.mute',
        popups: [
            {
                id: 'micMutedPopup',
                className: 'loginmenu',
                dataAttr: '[title]toolbar.micMutedPopup'
            },
            {
                id: 'unableToUnmutePopup',
                className: 'loginmenu',
                dataAttr: '[title]toolbar.unableToUnmutePopup'
            },
            {
                id: 'talkWhileMutedPopup',
                className: 'loginmenu',
                dataAttr: '[title]toolbar.talkWhileMutedPopup'
            }
        ],
        content: 'Mute / Unmute',
        i18n: '[content]toolbar.mute'
    },
    'camera': {
        id: 'toolbar_button_camera',
        tooltipKey: 'toolbar.videomute',
        className: 'button icon-camera',
        shortcut: 'V',
        shortcutAttr: 'toggleVideoPopover',
        shortcutFunc() {
            JitsiMeetJS.analytics.sendEvent('shortcut.videomute.toggled');
            APP.conference.toggleVideoMuted();
        },
        shortcutDescription: 'keyboardShortcuts.videoMute',
        content: 'Start / stop camera',
        i18n: '[content]toolbar.videomute'
    },
    'desktop': {
        id: 'toolbar_button_desktopsharing',
        tooltipKey: 'toolbar.sharescreen',
        className: 'button icon-share-desktop',
        shortcut: 'D',
        shortcutAttr: 'toggleDesktopSharingPopover',
        shortcutFunc() {
            JitsiMeetJS.analytics.sendEvent('shortcut.screen.toggled');
            APP.conference.toggleScreenSharing();
        },
        shortcutDescription: 'keyboardShortcuts.toggleScreensharing',
        content: 'Share screen',
        i18n: '[content]toolbar.sharescreen'
    },
    'invite': {
        id: 'toolbar_button_link',
        tooltipKey: 'toolbar.invite',
        className: 'button icon-link',
        content: 'Invite others',
        i18n: '[content]toolbar.invite'
    },
    'chat': {
        id: 'toolbar_button_chat',
        tooltipKey: 'toolbar.chat',
        className: 'button icon-chat',
        shortcut: 'C',
        shortcutAttr: 'toggleChatPopover',
        shortcutFunc() {
            JitsiMeetJS.analytics.sendEvent('shortcut.chat.toggled');
            APP.UI.toggleChat();
        },
        shortcutDescription: 'keyboardShortcuts.toggleChat',
        sideContainerId: 'chat_container',
        html: <span className = 'badge-round'>
            <span id = 'unreadMessages' />
        </span>
    },
    'contacts': {
        id: 'toolbar_contact_list',
        tooltipKey: 'bottomtoolbar.contactlist',
        className: 'button icon-contactList',
        sideContainerId: 'contacts_container',
        html: <span className = 'badge-round'>
            <span id = 'numberOfParticipants' />
        </span>
    },
    'profile': {
        id: 'toolbar_button_profile',
        tooltipKey: 'profile.setDisplayNameLabel',
        className: 'button',
        sideContainerId: 'profile_container',
        html: <img
            id = 'avatar'
            src = 'images/avatar2.png' />
    },
    'etherpad': {
        id: 'toolbar_button_etherpad',
        tooltipKey: 'toolbar.etherpad',
        className: 'button icon-share-doc'
    },
    'fullscreen': {
        id: 'toolbar_button_fullScreen',
        tooltipKey: 'toolbar.fullscreen',
        className: 'button icon-full-screen',
        shortcut: 'S',
        shortcutAttr: 'toggleFullscreenPopover',
        shortcutFunc() {
            JitsiMeetJS.analytics.sendEvent('shortcut.fullscreen.toggled');
            APP.UI.toggleFullScreen();
        },
        shortcutDescription: 'keyboardShortcuts.fullScreen',
        content: 'Enter / Exit Full Screen',
        i18n: '[content]toolbar.fullscreen'
    },
    'settings': {
        id: 'toolbar_button_settings',
        tooltipKey: 'toolbar.Settings',
        className: 'button icon-settings',
        sideContainerId: 'settings_container'
    },
    'hangup': {
        id: 'toolbar_button_hangup',
        tooltipKey: 'toolbar.hangup',
        className: 'button icon-hangup',
        content: 'Hang Up',
        i18n: '[content]toolbar.hangup'
    },
    'raisehand': {
        id: 'toolbar_button_raisehand',
        tooltipKey: 'toolbar.raiseHand',
        className: 'button icon-raised-hand',
        shortcut: 'R',
        shortcutAttr: 'raiseHandPopover',
        shortcutFunc() {
            JitsiMeetJS.analytics.sendEvent('shortcut.raisehand.clicked');
            APP.conference.maybeToggleRaisedHand();
        },
        shortcutDescription: 'keyboardShortcuts.raiseHand',
        content: 'Raise Hand',
        i18n: '[content]toolbar.raiseHand'
    },

    // init and btn handler: Recording.initRecordingButton (Recording.js)
    'recording': {
        id: 'toolbar_button_record',
        tooltipKey: 'liveStreaming.buttonTooltip',
        className: 'button',
        hidden: true // will be displayed once
                     // the recording functionality is detected
    },
    'sharedvideo': {
        id: 'toolbar_button_sharedvideo',
        tooltipKey: 'toolbar.sharedvideo',
        className: 'button icon-shared-video',
        popups: [
            {
                id: 'sharedVideoMutedPopup',
                className: 'loginmenu extendedToolbarPopup',
                dataAttr: '[title]toolbar.sharedVideoMutedPopup',
                dataAttrPosition: 'w'
            }
        ]
    },
    'sip': {
        id: 'toolbar_button_sip',
        tooltipKey: 'toolbar.sip',
        className: 'button icon-telephone',
        hidden: true // will be displayed once
                     // the SIP calls functionality is detected
    },
    'dialpad': {
        id: 'toolbar_button_dialpad',
        tooltipKey: 'toolbar.dialpad',
        className: 'button icon-dialpad',

        // TODO: remove it after UI.updateDTMFSupport fix
        hidden: true
    }
};

module.exports = defaultToolbarButtons;
