import { IStore } from '../../app/types';
import { showNotification } from '../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../notifications/constants';
import { setAudioMuted, setVideoMuted } from '../media/actions';
import { VIDEO_MUTISM_AUTHORITY } from '../media/constants';
import StateListenerRegistry from '../redux/StateListenerRegistry';

let hasShownNotification = false;

/**
 * Handles changes in the start muted policy for audio and video tracks in the meta data set for the conference.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/conference'].startAudioMutedPolicy,
    /* listener */ (startAudioMutedPolicy, store) => {
        _updateTrackMuteState(store, true);
    });

StateListenerRegistry.register(
    /* selector */ state => state['features/base/conference'].startVideoMutedPolicy,
    /* listener */(startVideoMutedPolicy, store) => {
        _updateTrackMuteState(store, false);
    });

/**
 * Updates the mute state of the track based on the start muted policy.
 *
 * @param {IStore} store - The redux store.
 * @param {boolean} isAudio - Whether the track is audio or video.
 * @returns {void}
 */
function _updateTrackMuteState(store: IStore, isAudio: boolean) {
    const { dispatch, getState } = store;
    const mutedPolicyKey = isAudio ? 'startAudioMutedPolicy' : 'startVideoMutedPolicy';
    const mutedPolicyValue = getState()['features/base/conference'][mutedPolicyKey];

    // Currently, the policy only supports force muting others, not unmuting them.
    if (!mutedPolicyValue) {
        return;
    }

    let muteStateUpdated = false;
    const { muted } = isAudio ? getState()['features/base/media'].audio : getState()['features/base/media'].video;

    if (isAudio && !Boolean(muted)) {
        dispatch(setAudioMuted(mutedPolicyValue, true));
        muteStateUpdated = true;
    } else if (!isAudio && !Boolean(muted)) {
        // TODO: Add a new authority for video mutism for the moderator case.
        dispatch(setVideoMuted(mutedPolicyValue, VIDEO_MUTISM_AUTHORITY.USER, true));
        muteStateUpdated = true;
    }

    if (!hasShownNotification && muteStateUpdated) {
        hasShownNotification = true;
        dispatch(showNotification({
            titleKey: 'notify.mutedTitle',
            descriptionKey: 'notify.muted'
        }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
    }
}
