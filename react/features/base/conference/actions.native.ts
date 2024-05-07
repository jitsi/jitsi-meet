import { IStore } from '../../app/types';
import { setAudioMuted, setVideoMuted } from '../media/actions';
import { MEDIA_TYPE, MediaType, VIDEO_MUTISM_AUTHORITY } from '../media/constants';

export * from './actions.any';

/**
 * Starts audio and/or video for the visitor.
 *
 * @param {Array<MediaType>} mediaTypes - The media types that need to be started.
 * @returns {Function}
 */
export function setupVisitorStartupMedia(mediaTypes: Array<MediaType>) {
    return (dispatch: IStore['dispatch']) => {
        if (!mediaTypes || !Array.isArray(mediaTypes)) {
            return;
        }

        mediaTypes.forEach(mediaType => {
            switch (mediaType) {
            case MEDIA_TYPE.AUDIO:
                dispatch(setAudioMuted(false, true));
                break;
            case MEDIA_TYPE.VIDEO:
                dispatch(setVideoMuted(false, VIDEO_MUTISM_AUTHORITY.USER, true));
            }
        });
    };
}
