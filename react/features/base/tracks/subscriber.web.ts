import { isEqual, sortBy } from 'lodash-es';

// @ts-expect-error
import VideoLayout from '../../../../modules/UI/videolayout/VideoLayout';
import { getAutoPinSetting } from '../../video-layout/functions.any';
import { MEDIA_TYPE } from '../media/constants';
import { getScreenshareParticipantIds } from '../participants/functions';
import StateListenerRegistry from '../redux/StateListenerRegistry';

import { isLocalTrackMuted } from './functions';

/**
 * Notifies when the list of currently sharing participants changes.
 */
StateListenerRegistry.register(
    /* selector */ state => getScreenshareParticipantIds(state),
    /* listener */ (participantIDs, store, previousParticipantIDs) => {
        if (getAutoPinSetting() && participantIDs !== previousParticipantIDs) {
            const { participantId } = store.getState()['features/large-video'];

            // Check if any new screenshare participants were added
            const newParticipants = participantIDs.filter((id: string) => !previousParticipantIDs.includes(id));

            // If the current large video participant is a new screensharer, update the display. This is needed when
            // the track is created much later after the action for auto-pinning is dispatched. This usually happens in
            // very large meetings if the screenshare was already ongoing when the participant joined. The track is
            // signaled only after the receiver constraints with SS source id is processed by the bridge but the
            // auto-pinning action is dispatched when the participant tile is created as soon as the presence is
            // received.
            if (participantId && newParticipants.includes(participantId)) {
                VideoLayout.updateLargeVideo(participantId, true);
            }
        }

        if (!isEqual(sortBy(participantIDs), sortBy(previousParticipantIDs))) {
            APP.API.notifySharingParticipantsChanged(participantIDs);
        }
    }
);


/**
 * Notifies when the local video mute state changes.
 */
StateListenerRegistry.register(
    /* selector */ state => isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.VIDEO),
    /* listener */ (muted, store, previousMuted) => {
        if (muted !== previousMuted) {
            APP.API.notifyVideoMutedStatusChanged(muted);
        }
    }
);
