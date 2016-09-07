/* global APP, $, config, interfaceConfig, JitsiMeetJS */

const DefaultToolbarButtons = {
    'microphone': {
        id: '#toolbar_button_mute',
        key: 'toolbar.mute',
        shortcut: 'M',
        shortcutAttr: 'mutePopover',
        shortcutFunc: function() {
            JitsiMeetJS.analytics.sendEvent('shortcut.audiomute.toggled');
            APP.conference.toggleAudioMuted();
        },
        shortcutDescription: "keyboardShortcuts.mute"
    },
    'camera': {
        id: '#toolbar_button_camera',
        key: 'toolbar.videomute',
        shortcut: 'V',
        shortcutAttr: 'toggleVideoPopover',
        shortcutFunc: function() {
            JitsiMeetJS.analytics.sendEvent('shortcut.videomute.toggled');
            APP.conference.toggleVideoMuted();
        },
        shortcutDescription: "keyboardShortcuts.videoMute"
    },
    'desktop': {
        id: '#toolbar_button_desktopsharing',
        key: 'toolbar.sharescreen',
        shortcut: 'D',
        shortcutAttr: 'toggleDesktopSharingPopover',
        shortcutFunc: function() {
            JitsiMeetJS.analytics.sendEvent('shortcut.screen.toggled');
            APP.conference.toggleScreenSharing();
        },
        shortcutDescription: "keyboardShortcuts.toggleScreensharing"
    },
    'security': {
        id: '#toolbar_button_security',
        key: 'toolbar.lock'
    },
    'invite': {
        id: '#toolbar_button_link',
        key: 'toolbar.invite'
    },
    'recording': {
        id: '#toolbar_button_record',
        key: 'liveStreaming.buttonTooltip'
    },
    'chat': {
        id: '#toolbar_button_chat',
        key: 'toolbar.chat',
        shortcut: 'C',
        shortcutAttr: 'toggleChatPopover',
        shortcutFunc: function() {
            JitsiMeetJS.analytics.sendEvent('shortcut.chat.toggled');
            APP.UI.toggleChat();
        },
        shortcutDescription: "keyboardShortcuts.toggleChat"
    },
    'etherpad': {
        id: '#toolbar_button_etherpad',
        key: 'toolbar.etherpad'
    },
    'sharedvideo': {
        id: '#toolbar_button_sharedvideo',
        key: 'toolbar.sharedvideo'
    },
    'fullscreen': {
        id: '#toolbar_button_fullScreen',
        key: 'toolbar.fullscreen'
    },
    'settings': {
        id: '#toolbar_button_settings',
        key: 'toolbar.Settings'
    },
    'hangup': {
        id: '#toolbar_button_hangup',
        key: 'toolbar.hangup'
    },
    'sip': {
        id: '#toolbar_button_sip',
        key: 'toolbar.sip'
    },
    'dialpag': {
        id: '#toolbar_button_dialpad',
        key: 'toolbar.dialpad'
    }
};

export default DefaultToolbarButtons;