/* @flow */

import React from 'react';

import { openDeviceSelectionDialog } from '../device-selection';
import { openDialOutDialog } from '../dial-out';
import { openAddPeopleDialog, openInviteDialog } from '../invite';
import UIEvents from '../../../service/UI/UIEvents';

declare var APP: Object;
declare var interfaceConfig: Object;
declare var JitsiMeetJS: Object;

/**
 * All toolbar buttons' descriptors.
 */
const buttons: Object = {
    addtocall: {
        classNames: [ 'button', 'icon-add' ],
        enabled: true,
        id: 'toolbar_button_add',
        isDisplayed: () => !APP.store.getState()['features/jwt'].isGuest,
        onClick() {
            JitsiMeetJS.analytics.sendEvent('toolbar.add.clicked');

            return openAddPeopleDialog();
        },
        tooltipKey: 'toolbar.addPeople'
    },

    /**
     * The descriptor of the camera toolbar button.
     */
    camera: {
        classNames: [ 'button', 'icon-camera' ],
        enabled: true,
        isDisplayed: () => true,
        id: 'toolbar_button_camera',
        onClick() {
            if (APP.conference.videoMuted) {
                JitsiMeetJS.analytics.sendEvent('toolbar.video.enabled');
                APP.UI.emitEvent(UIEvents.VIDEO_MUTED, false);
            } else {
                JitsiMeetJS.analytics.sendEvent('toolbar.video.disabled');
                APP.UI.emitEvent(UIEvents.VIDEO_MUTED, true);
            }
        },
        popups: [
            {
                className: 'loginmenu',
                dataAttr: 'audioOnly.featureToggleDisabled',
                dataInterpolate: { feature: 'video mute' },
                id: 'unmuteWhileAudioOnly'
            }
        ],
        shortcut: 'V',
        shortcutAttr: 'toggleVideoPopover',
        shortcutFunc() {
            if (APP.conference.isAudioOnly()) {
                APP.UI.emitEvent(UIEvents.VIDEO_UNMUTING_WHILE_AUDIO_ONLY);

                return;
            }

            JitsiMeetJS.analytics.sendEvent('shortcut.videomute.toggled');
            APP.conference.toggleVideoMuted();
        },
        shortcutDescription: 'keyboardShortcuts.videoMute',
        tooltipKey: 'toolbar.videomute'
    },

    /**
     * The descriptor of the chat toolbar button.
     */
    chat: {
        classNames: [ 'button', 'icon-chat' ],
        enabled: true,
        html: <span className = 'badge-round'>
            <span id = 'unreadMessages' />
        </span>,
        id: 'toolbar_button_chat',
        onClick() {
            JitsiMeetJS.analytics.sendEvent('toolbar.chat.toggled');
            APP.UI.emitEvent(UIEvents.TOGGLE_CHAT);
        },
        shortcut: 'C',
        shortcutAttr: 'toggleChatPopover',
        shortcutFunc() {
            JitsiMeetJS.analytics.sendEvent('shortcut.chat.toggled');
            APP.UI.toggleChat();
        },
        shortcutDescription: 'keyboardShortcuts.toggleChat',
        sideContainerId: 'chat_container',
        tooltipKey: 'toolbar.chat'
    },

    /**
     * The descriptor of the contact list toolbar button.
     */
    contacts: {
        classNames: [ 'button', 'icon-contactList' ],
        enabled: true,

        // XXX: Hotfix to solve race condition between toolbox rendering and
        // contact list view that updates the number of active participants
        // via jQuery. There is case when contact list view updates number of
        // participants but toolbox has not been rendered yet. Since this issue
        // is reproducible only for conferences with the only participant let's
        // use 1 participant as a default value for this badge. Later after
        // reactification of contact list let's use the value of active
        // paricipants from Redux store.
        html: <span className = 'badge-round'>
            <span id = 'numberOfParticipants'>1</span>
        </span>,
        id: 'toolbar_contact_list',
        onClick() {
            JitsiMeetJS.analytics.sendEvent(
                'toolbar.contacts.toggled');
            APP.UI.emitEvent(UIEvents.TOGGLE_CONTACT_LIST);
        },
        sideContainerId: 'contacts_container',
        tooltipKey: 'bottomtoolbar.contactlist'
    },

    /**
     * The descriptor of the desktop sharing toolbar button.
     */
    desktop: {
        classNames: [ 'button', 'icon-share-desktop' ],
        enabled: true,
        id: 'toolbar_button_desktopsharing',
        onClick() {
            if (APP.conference.isSharingScreen) {
                JitsiMeetJS.analytics.sendEvent('toolbar.screen.disabled');
            } else {
                JitsiMeetJS.analytics.sendEvent('toolbar.screen.enabled');
            }
            APP.UI.emitEvent(UIEvents.TOGGLE_SCREENSHARING);
        },
        popups: [
            {
                className: 'loginmenu',
                dataAttr: 'audioOnly.featureToggleDisabled',
                dataInterpolate: { feature: 'screen sharing' },
                id: 'screenshareWhileAudioOnly'
            }
        ],
        shortcut: 'D',
        shortcutAttr: 'toggleDesktopSharingPopover',
        shortcutFunc() {
            JitsiMeetJS.analytics.sendEvent('shortcut.screen.toggled');
            APP.conference.toggleScreenSharing();
        },
        shortcutDescription: 'keyboardShortcuts.toggleScreensharing',
        tooltipKey: 'toolbar.sharescreen'
    },

    /**
     * The descriptor of the dial out toolbar button.
     */
    dialout: {
        classNames: [ 'button', 'icon-telephone' ],
        enabled: true,

        // Will be displayed once the SIP calls functionality is detected.
        hidden: true,
        id: 'toolbar_button_dial_out',
        onClick() {
            JitsiMeetJS.analytics.sendEvent('toolbar.sip.clicked');

            return openDialOutDialog();
        },
        tooltipKey: 'dialOut.dialOut'
    },

    /**
     * The descriptor of the device selection toolbar button.
     */
    fodeviceselection: {
        classNames: [ 'button', 'icon-settings' ],
        enabled: true,
        isDisplayed() {
            return interfaceConfig.filmStripOnly;
        },
        id: 'toolbar_button_fodeviceselection',
        onClick() {
            JitsiMeetJS.analytics.sendEvent(
                'toolbar.fodeviceselection.toggled');

            return openDeviceSelectionDialog();
        },
        sideContainerId: 'settings_container',
        tooltipKey: 'toolbar.Settings'
    },

    /**
     * The descriptor of the dialpad toolbar button.
     */
    dialpad: {
        classNames: [ 'button', 'icon-dialpad' ],
        enabled: true,

        // TODO: remove it after UI.updateDTMFSupport fix
        hidden: true,
        id: 'toolbar_button_dialpad',
        onClick() {
            JitsiMeetJS.analytics.sendEvent('toolbar.sip.dialpad.clicked');
        },
        tooltipKey: 'toolbar.dialpad'
    },

    /**
     * The descriptor of the etherpad toolbar button.
     */
    etherpad: {
        classNames: [ 'button', 'icon-share-doc' ],
        enabled: true,
        hidden: true,
        id: 'toolbar_button_etherpad',
        onClick() {
            JitsiMeetJS.analytics.sendEvent('toolbar.etherpad.clicked');
            APP.UI.emitEvent(UIEvents.ETHERPAD_CLICKED);
        },
        tooltipKey: 'toolbar.etherpad'
    },

    /**
     * The descriptor of the toolbar button which toggles full-screen mode.
     */
    fullscreen: {
        classNames: [ 'button', 'icon-full-screen' ],
        enabled: true,
        id: 'toolbar_button_fullScreen',
        onClick() {
            JitsiMeetJS.analytics.sendEvent('toolbar.fullscreen.enabled');

            APP.UI.emitEvent(UIEvents.TOGGLE_FULLSCREEN);
        },
        shortcut: 'S',
        shortcutAttr: 'toggleFullscreenPopover',
        shortcutDescription: 'keyboardShortcuts.fullScreen',
        shortcutFunc() {
            JitsiMeetJS.analytics.sendEvent('shortcut.fullscreen.toggled');
            APP.UI.toggleFullScreen();
        },
        tooltipKey: 'toolbar.fullscreen'
    },

    /**
     * The descriptor of the toolbar button which hangs up the call/conference.
     */
    hangup: {
        classNames: [ 'button', 'icon-hangup', 'button_hangup' ],
        enabled: true,
        isDisplayed: () => true,
        id: 'toolbar_button_hangup',
        onClick() {
            JitsiMeetJS.analytics.sendEvent('toolbar.hangup');
            APP.UI.emitEvent(UIEvents.HANGUP);
        },
        tooltipKey: 'toolbar.hangup'
    },

    /**
     * The descriptor of the toolbar button which shows the invite user dialog.
     */
    invite: {
        classNames: [ 'button', 'icon-link' ],
        enabled: true,
        id: 'toolbar_button_link',
        onClick() {
            JitsiMeetJS.analytics.sendEvent('toolbar.invite.clicked');

            return openInviteDialog();
        },
        tooltipKey: 'toolbar.invite'
    },

    /**
     * The descriptor of the microphone toolbar button.
     */
    microphone: {
        classNames: [ 'button', 'icon-microphone' ],
        enabled: true,
        isDisplayed: () => true,
        id: 'toolbar_button_mute',
        onClick() {
            const sharedVideoManager = APP.UI.getSharedVideoManager();

            if (APP.conference.audioMuted) {
                // If there's a shared video with the volume "on" and we aren't
                // the video owner, we warn the user
                // that currently it's not possible to unmute.
                if (sharedVideoManager
                    && sharedVideoManager.isSharedVideoVolumeOn()
                    && !sharedVideoManager.isSharedVideoOwner()) {
                    APP.UI.showCustomToolbarPopup(
                        '#unableToUnmutePopup', true, 5000);
                } else {
                    JitsiMeetJS.analytics.sendEvent('toolbar.audio.unmuted');
                    APP.UI.emitEvent(UIEvents.AUDIO_MUTED, false, true);
                }
            } else {
                JitsiMeetJS.analytics.sendEvent('toolbar.audio.muted');
                APP.UI.emitEvent(UIEvents.AUDIO_MUTED, true, true);
            }
        },
        popups: [
            {
                className: 'loginmenu',
                dataAttr: 'toolbar.micMutedPopup',
                id: 'micMutedPopup'
            },
            {
                className: 'loginmenu',
                dataAttr: 'toolbar.unableToUnmutePopup',
                id: 'unableToUnmutePopup'
            },
            {
                className: 'loginmenu',
                dataAttr: 'toolbar.talkWhileMutedPopup',
                id: 'talkWhileMutedPopup'
            }
        ],
        shortcut: 'M',
        shortcutAttr: 'mutePopover',
        shortcutFunc() {
            JitsiMeetJS.analytics.sendEvent('shortcut.audiomute.toggled');
            APP.conference.toggleAudioMuted();
        },
        shortcutDescription: 'keyboardShortcuts.mute',
        tooltipKey: 'toolbar.mute'
    },

    /**
     * The descriptor of the profile toolbar button.
     */
    profile: {
        classNames: [ 'button' ],
        enabled: true,
        html: <img
            id = 'avatar'
            src = 'images/avatar2.png' />,
        id: 'toolbar_button_profile',
        onClick() {
            JitsiMeetJS.analytics.sendEvent('toolbar.profile.toggled');
            APP.UI.emitEvent(UIEvents.TOGGLE_PROFILE);
        },
        sideContainerId: 'profile_container',
        tooltipKey: 'profile.setDisplayNameLabel'
    },

    /**
     * The descriptor of the "Raise hand" toolbar button.
     */
    raisehand: {
        classNames: [ 'button', 'icon-raised-hand' ],
        enabled: true,
        id: 'toolbar_button_raisehand',
        onClick() {
            JitsiMeetJS.analytics.sendEvent('toolbar.raiseHand.clicked');
            APP.conference.maybeToggleRaisedHand();
        },
        shortcut: 'R',
        shortcutAttr: 'raiseHandPopover',
        shortcutDescription: 'keyboardShortcuts.raiseHand',
        shortcutFunc() {
            JitsiMeetJS.analytics.sendEvent('shortcut.raisehand.clicked');
            APP.conference.maybeToggleRaisedHand();
        },
        tooltipKey: 'toolbar.raiseHand'
    },

    /**
     * The descriptor of the recording toolbar button. Requires additional
     * initialization in the recording module.
     */
    recording: {
        classNames: [ 'button' ],
        enabled: true,

        // will be displayed once the recording functionality is detected
        hidden: true,
        id: 'toolbar_button_record',
        tooltipKey: 'liveStreaming.buttonTooltip'
    },

    /**
     * The descriptor of the settings toolbar button.
     */
    settings: {
        classNames: [ 'button', 'icon-settings' ],
        enabled: true,
        id: 'toolbar_button_settings',
        onClick() {
            JitsiMeetJS.analytics.sendEvent('toolbar.settings.toggled');
            APP.UI.emitEvent(UIEvents.TOGGLE_SETTINGS);
        },
        sideContainerId: 'settings_container',
        tooltipKey: 'toolbar.Settings'
    },

    /**
     * The descriptor of the "Share YouTube video" toolbar button.
     */
    sharedvideo: {
        classNames: [ 'button', 'icon-shared-video' ],
        enabled: true,
        id: 'toolbar_button_sharedvideo',
        onClick() {
            JitsiMeetJS.analytics.sendEvent('toolbar.sharedvideo.clicked');
            APP.UI.emitEvent(UIEvents.SHARED_VIDEO_CLICKED);
        },
        popups: [
            {
                className: 'loginmenu extendedToolbarPopup',
                dataAttr: 'toolbar.sharedVideoMutedPopup',
                dataAttrPosition: 'w',
                id: 'sharedVideoMutedPopup'
            }
        ],
        tooltipKey: 'toolbar.sharedvideo'
    }
};


Object.keys(buttons).forEach(name => {
    const button = buttons[name];

    if (!button.isDisplayed) {
        button.isDisplayed = () => !interfaceConfig.filmStripOnly;
    }
});

export default buttons;
