import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { setAudioMuted } from '../base/media/actions';
import { MEDIA_TYPE } from '../base/media/constants';
import { raiseHand } from '../base/participants/actions';
import { getLocalParticipant } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { playSound, registerSound, unregisterSound } from '../base/sounds/actions';
import { hideNotification, showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';
import { isForceMuted } from '../participants-pane/functions';
import { isAudioMuteButtonDisabled } from '../toolbox/functions.any';

import { setCurrentNotificationUid } from './actions';
import { TALK_WHILE_MUTED_SOUND_ID } from './constants';
import { TALK_WHILE_MUTED_SOUND_FILE } from './sounds';

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { dispatch, getState } = store;
    const { conference } = action;

    switch (action.type) {
    case APP_WILL_MOUNT:
        dispatch(registerSound(TALK_WHILE_MUTED_SOUND_ID, TALK_WHILE_MUTED_SOUND_FILE));
        break;
    case APP_WILL_UNMOUNT:
        dispatch(unregisterSound(TALK_WHILE_MUTED_SOUND_ID));
        break;

    case CONFERENCE_JOINED: {
        conference.on(
            JitsiConferenceEvents.TRACK_MUTE_CHANGED,
            (track: any) => {
                const { currentNotificationUid } = getState()['features/talk-while-muted'];

                if (currentNotificationUid && track.isAudioTrack() && track.isLocal() && !track.isMuted()) {
                    dispatch(hideNotification(currentNotificationUid));
                    dispatch(setCurrentNotificationUid());
                }
            });
        conference.on(
            JitsiConferenceEvents.TALK_WHILE_MUTED, () => {
                const state = getState();
                const local = getLocalParticipant(state);

                // Display the talk while muted notification only when the audio button is not disabled.
                if (!isAudioMuteButtonDisabled(state)) {
                    const forceMuted = isForceMuted(local, MEDIA_TYPE.AUDIO, state);
                    const notification = dispatch(showNotification({
                        titleKey: 'toolbar.talkWhileMutedPopup',
                        customActionNameKey: [ forceMuted ? 'notify.raiseHandAction' : 'notify.unmute' ],
                        customActionHandler: [ () => dispatch(forceMuted ? raiseHand(true) : setAudioMuted(false)) ]
                    }, NOTIFICATION_TIMEOUT_TYPE.LONG));

                    const { soundsTalkWhileMuted } = getState()['features/base/settings'];

                    if (soundsTalkWhileMuted) {
                        dispatch(playSound(TALK_WHILE_MUTED_SOUND_ID));
                    }

                    if (notification) {
                        // we store the last start muted notification id that we showed,
                        // so we can hide it when unmuted mic is detected
                        dispatch(setCurrentNotificationUid(notification.uid));
                    }
                }
            });
        break;
    }
    }

    return result;
});
