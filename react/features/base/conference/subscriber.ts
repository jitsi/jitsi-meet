import { IStore } from '../../app/types';
import { showNotification } from '../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../notifications/constants';
import StateListenerRegistry from '../redux/StateListenerRegistry';
import { setAudioMuted, setVideoMuted } from '../media/actions';
import { VIDEO_MUTISM_AUTHORITY } from '../media/constants';

let hasShownNotification = false;

/**
 * Handles changes in the start muted policy for audio and video tracks in the meta data set for the conference.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/conference'].startAudioMutedPolicy,
    /* listener */ (startAudioMutedPolicy, store) => {
        _updateTrackMuteState(store, startAudioMutedPolicy, true);
    });

StateListenerRegistry.register(
    /* selector */ state => state['features/base/conference'].startVideoMutedPolicy,
    /* listener */(startVideoMutedPolicy, store) => {
        _updateTrackMuteState(store, startVideoMutedPolicy, false);
    });

function _updateTrackMuteState(store: IStore, mutedPolicy: boolean, isAudio: boolean) {
    const { dispatch } = store;

    // Only enforce joining muted as of now.
    if (isAudio) {
        mutedPolicy && dispatch(setAudioMuted(mutedPolicy, true));
    } else {
        mutedPolicy && dispatch(setVideoMuted(mutedPolicy, VIDEO_MUTISM_AUTHORITY.USER, true));
    }

    if (!hasShownNotification) {
        hasShownNotification = true;
        dispatch(showNotification({
            titleKey: 'notify.mutedTitle',
            descriptionKey: 'notify.muted'
        }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
    }
}
