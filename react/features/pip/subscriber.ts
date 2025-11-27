import { IReduxState } from '../app/types';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import { isAudioMutedForPiP, isVideoMutedForPiP, updateMediaSessionState } from './functions';

/**
 * Listens to audio and video mute state changes when PiP is active
 * and updates the MediaSession API to reflect the current state in PiP controls.
 */
StateListenerRegistry.register(
    /* selector */ (state: IReduxState) => {
        const isPiPActive = state['features/pip']?.isPiPActive;

        if (!isPiPActive) {
            return null;
        }

        return {
            audioMuted: isAudioMutedForPiP(state),
            videoMuted: isVideoMutedForPiP(state)
        };
    },
    /* listener */ (muteState: { audioMuted: boolean; videoMuted: boolean; } | null) => {
        if (muteState === null) {
            return;
        }

        updateMediaSessionState({
            cameraActive: !muteState.videoMuted,
            microphoneActive: !muteState.audioMuted
        });
    },
    {
        deepEquals: true
    }
);
