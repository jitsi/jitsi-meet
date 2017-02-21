/* @flow */

import UIEvents from '../../../../service/UI/UIEvents';

declare var APP: Object;
declare var JitsiMeetJS: Object;

const primaryToolbarHandlers = {
    'toolbar_button_mute': function() {
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
            }
            else {
                JitsiMeetJS.analytics.sendEvent('toolbar.audio.unmuted');
                emitter.emit(UIEvents.AUDIO_MUTED, false, true);
            }
        } else {
            JitsiMeetJS.analytics.sendEvent('toolbar.audio.muted');
            emitter.emit(UIEvents.AUDIO_MUTED, true, true);
        }
    },
    'toolbar_button_camera': () => {
        if (APP.conference.videoMuted) {
            JitsiMeetJS.analytics.sendEvent('toolbar.video.enabled');
            emitter.emit(UIEvents.VIDEO_MUTED, false);
        } else {
            JitsiMeetJS.analytics.sendEvent('toolbar.video.disabled');
            emitter.emit(UIEvents.VIDEO_MUTED, true);
        }
    },
    'toolbar_button_link': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.invite.clicked');
        emitter.emit(UIEvents.INVITE_CLICKED);
    },
    'toolbar_button_fullScreen': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.fullscreen.enabled');

        emitter.emit(UIEvents.TOGGLE_FULLSCREEN);
    },
    'toolbar_button_hangup': () => {
        JitsiMeetJS.analytics.sendEvent('toolbar.hangup');
        emitter.emit(UIEvents.HANGUP);
    }
};

export default primaryToolbarHandlers;
