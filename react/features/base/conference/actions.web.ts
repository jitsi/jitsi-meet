import { IStore } from '../../app/types';
import { gumPending } from '../media/actions';
import { MEDIA_TYPE, MediaType } from '../media/constants';
import { IGUMPendingState } from '../media/types';
import { createAndAddInitialAVTracks } from '../tracks/actions.web';

export * from './actions.any';

/**
 * Starts audio and/or video for the visitor.
 *
 * @param {Array<MediaType>} media - The media types that need to be started.
 * @returns {Function}
 */
export function setupVisitorStartupMedia(media: Array<MediaType>) {
    return (dispatch: IStore['dispatch']) => {
        // Clear the gum pending state in case we have set it to pending since we are starting the
        // conference without tracks.
        dispatch(gumPending([ MEDIA_TYPE.AUDIO, MEDIA_TYPE.VIDEO ], IGUMPendingState.NONE));

        if (media && Array.isArray(media) && media.length > 0) {
            dispatch(createAndAddInitialAVTracks(media));
        }
    };
}
