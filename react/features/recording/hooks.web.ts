import { useSelector } from 'react-redux';

import { IReduxState } from '../app/types';
import { MEET_FEATURES } from '../base/jwt/constants';
import { isJwtFeatureEnabled } from '../base/jwt/functions';
import { isLocalParticipantModerator } from '../base/participants/functions';
import { isInBreakoutRoom } from '../breakout-rooms/functions';

import { getLiveStreaming } from './components/LiveStream/functions';
import LiveStreamButton from './components/LiveStream/web/LiveStreamButton';
import RecordButton from './components/Recording/web/RecordButton';
import { getRecordButtonProps, isLiveStreamingButtonVisible } from './functions';


const recording = {
    key: 'recording',
    Content: RecordButton,
    group: 2
};

const livestreaming = {
    key: 'livestreaming',
    Content: LiveStreamButton,
    group: 2
};

/**
 * A hook that returns the recording button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useRecordingButton() {
    const recordingProps = useSelector(getRecordButtonProps);
    const toolbarButtons = useSelector((state: IReduxState) => state['features/toolbox'].toolbarButtons);
    const isModerator = useSelector((state: IReduxState) => isLocalParticipantModerator(state));

    if (toolbarButtons?.includes('recording') && recordingProps.visible && isModerator) {
        return recording;
    }

}

/**
 * A hook that returns the livestreaming button if it is enabled and undefined otherwise.
 *
 *  @returns {Object | undefined}
 */
export function useLiveStreamingButton() {
    const toolbarButtons = useSelector((state: IReduxState) => state['features/toolbox'].toolbarButtons);
    const liveStreaming = useSelector(getLiveStreaming);
    const liveStreamingAllowed = useSelector((state: IReduxState) =>
        isJwtFeatureEnabled(state, MEET_FEATURES.LIVESTREAMING, false));
    const _isInBreakoutRoom = useSelector(isInBreakoutRoom);

    if (toolbarButtons?.includes('recording')
            && isLiveStreamingButtonVisible({
                liveStreamingAllowed,
                liveStreamingEnabled: liveStreaming?.enabled,
                isInBreakoutRoom: _isInBreakoutRoom
            })) {
        return livestreaming;
    }
}
