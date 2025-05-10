import { IReduxState } from '../app/types';
import { isNarrowScreenWithChatOpen } from '../base/responsive-ui/functions';
import { shouldDisplayTileView } from '../video-layout/functions.any';

/**
 * Selects the thumbnail height to the quality level mapping from the config.
 *
 * @param {Object} state - The redux state.
 * @returns {Map<number,number>}
 */
export function getMinHeightForQualityLvlMap(state: IReduxState): Map<number, number> {
    return state['features/video-quality'].minHeightForQualityLvl;
}

/**
 * Determines whether the video quality label should be displayed.
 *
 * @param {IReduxState} state - The current Redux state of the application.
 * @returns {boolean} - True if the video quality label should be displayed, otherwise false.
 */
export function shouldDisplayVideoQualityLabel(state: IReduxState): boolean {
    const hideVideoQualityLabel
        = shouldDisplayTileView(state)
            || interfaceConfig.VIDEO_QUALITY_LABEL_DISABLED

            // Hide the video quality label for desktop browser if the chat is open and there isn't enough space
            // to display it.
            || isNarrowScreenWithChatOpen(state);

    return !hideVideoQualityLabel;
}
