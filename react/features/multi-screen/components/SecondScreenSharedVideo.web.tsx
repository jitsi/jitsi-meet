import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../app/types';
import VideoManager from '../../shared-video/components/web/VideoManager';
import YoutubeVideoManager from '../../shared-video/components/web/YoutubeVideoManager';
import { isSharedVideoEnabled, isVideoPlaying } from '../../shared-video/functions';
import logger from '../logger';

/**
 * The type of the React {@code Component} props of {@link SecondScreenSharedVideo}.
 */
interface IProps {

    /**
     * The id of the second-screen window this view renders into.
     */
    id: string;
}

/**
 * The styles, injected into the second window via its own Emotion cache.
 */
const useStyles = makeStyles()(() => {
    return {
        container: {
            width: '100%',
            height: '100%',
            backgroundColor: '#040404',

            // The follower player is view-only: a local pause here would not
            // be reflected in the meeting and would silently desync until the
            // owner's next update.
            pointerEvents: 'none',

            // react-youtube renders the player inside a plain wrapper div;
            // stretch it (and the player itself) to fill the window.
            '& > div, & iframe, & video': {
                width: '100%',
                height: '100%'
            }
        },
        placeholder: {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#040404'
        },
        message: {
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.5)'
        }
    };
});

/**
 * Renders the video (e.g. YouTube) shared in the meeting on a second screen.
 * The player is the same manager the meeting window uses, mounted as a
 * follower: it tracks the shared playback state (play/pause/seek) but never
 * acts as the controlling player, and plays no audio; the audio stays with
 * the main window's player. Like the whiteboard, this is the kind of
 * non-video content a plain {@code <video>} second screen cannot host.
 * Requires a video to be shared in the meeting; otherwise a hint is shown.
 *
 * @param {IProps} props - The component props.
 * @returns {ReactElement}
 */
const SecondScreenSharedVideo = ({ id }: IProps) => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const sharedVideoEnabled = useSelector(isSharedVideoEnabled);
    const videoShared = useSelector(isVideoPlaying);
    const videoUrl = useSelector((state: IReduxState) => state['features/shared-video'].videoUrl);
    const [ failed, setFailed ] = useState(false);

    // A failure belongs to the video that caused it: a newly shared one gets a
    // fresh attempt.
    useEffect(() => setFailed(false), [ videoUrl ]);

    // The player itself cannot report this: a follower must not stop the
    // meeting's shared video, so without this the window just stays black.
    const onFollowerError = useCallback((code?: any) => {
        logger.error(`Shared video failed on second screen "${id}"`, code);
        APP.API?.notifySecondScreenError?.({ id, error: 'shared-video-error' });
        setFailed(true);
    }, [ id ]);

    if (!sharedVideoEnabled || !videoShared || !videoUrl) {
        return (
            <div className = { classes.placeholder }>
                <div className = { classes.message }>
                    { t('multiScreen.sharedVideoInactive') }
                </div>
            </div>
        );
    }

    if (failed) {
        return (
            <div className = { classes.placeholder }>
                <div className = { classes.message }>
                    { t('multiScreen.sharedVideoError') }
                </div>
            </div>
        );
    }

    // The same manager split as the meeting's SharedVideo component: direct
    // http(s) links get the plain <video> manager, anything else is a
    // YouTube video id.
    return (
        <div className = { classes.container }>
            { videoUrl.match(/http/)
                ? <VideoManager
                    follower = { true }
                    onFollowerError = { onFollowerError }
                    videoId = { videoUrl } />
                : <YoutubeVideoManager
                    follower = { true }
                    onFollowerError = { onFollowerError }
                    videoId = { videoUrl } /> }
        </div>
    );
};

export default SecondScreenSharedVideo;
