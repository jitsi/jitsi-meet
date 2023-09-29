import { IReduxState } from '../../app/types';
import { getCurrentConference } from '../../base/conference/functions';
import { isAnyDialogOpen } from '../../base/dialog/functions';
import { FULLSCREEN_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { isLocalVideoTrackDesktop } from '../../base/tracks/functions.any';

/**
 * Checks whether full-screen state should be used or not.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - Whether full-screen state shuld be used or not.
 */
export function shouldUseFullScreen(state: IReduxState) {
    const { enabled: audioOnly } = state['features/base/audio-only'];
    const conference = getCurrentConference(state);
    const dialogOpen = isAnyDialogOpen(state);
    const fullscreenEnabled = getFeatureFlag(state, FULLSCREEN_ENABLED, true);
    const isDesktopSharing = isLocalVideoTrackDesktop(state);

    return conference ? !audioOnly && !dialogOpen && !isDesktopSharing && fullscreenEnabled : false;
}
