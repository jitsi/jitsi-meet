import { throttle } from 'lodash-es';
import { PureComponent } from 'react';

import { createSharedVideoEvent as createEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState, IStore } from '../../../app/types';
import { getCurrentConference } from '../../../base/conference/functions';
import { IJitsiConference } from '../../../base/conference/reducer';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { getLocalParticipant } from '../../../base/participants/functions';
import { isLocalTrackMuted } from '../../../base/tracks/functions';
import { showWarningNotification } from '../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../../notifications/constants';
import { dockToolbox } from '../../../toolbox/actions';
import { muteLocal } from '../../../video-menu/actions.any';
import { setSharedVideoStatus, stopSharedVideo } from '../../actions';
import { PLAYBACK_STATUSES } from '../../constants';
import logger from '../../logger';

/**
 * Return true if the difference between the two times is larger than 5.
 *
 * @param {number} newTime - The current time.
 * @param {number} previousTime - The previous time.
 * @private
 * @returns {boolean}
*/
function shouldSeekToPosition(newTime: number, previousTime: number) {
    return Math.abs(newTime - previousTime) > 5;
}

/**
 * The type of the React {@link PureComponent} props of {@link AbstractVideoManager}.
 */
export interface IProps {

    /**
     * The current conference.
     */
    _conference?: IJitsiConference;

    /**
     * Warning that indicates an incorrect video url.
     */
    _displayWarning: Function;

    /**
     * Docks the toolbox.
     */
    _dockToolbox: Function;

    /**
     * Indicates whether the local audio is muted.
    */
    _isLocalAudioMuted: boolean;

    /**
     * Is the video shared by the local user.
     *
     * @private
     */
    _isOwner: boolean;

    /**
     * Mutes local audio track.
     */
    _muteLocal: Function;

    /**
     * Store flag for muted state.
     */
    _muted?: boolean;

    /**
     * The shared video owner id.
     */
    _ownerId?: string;

    /**
     * Updates the shared video status.
     */
    _setSharedVideoStatus: Function;

    /**
     * The shared video status.
     */
    _status?: string;

    /**
     * Action to stop video sharing.
    */
    _stopSharedVideo: Function;

    /**
     * Seek time in seconds.
     *
     */
    _time?: number;

    /**
     * The video url.
     */
    _videoUrl?: string;

    /**
     * Whether this player is a passive follower (e.g. on a second-screen
     * window): it follows the shared playback state but never acts as the
     * controlling player, even when the local participant owns the shared
     * video, reports no analytics or status updates, and plays no audio (the
     * audio stays with the main window's player).
     */
    follower?: boolean;

    /**
     * Called when a follower player fails. A follower must not tear down the
     * meeting's shared video, so its host is notified instead and surfaces the
     * failure in place of the (black) player. Ignored for a non-follower.
     */
    onFollowerError?: (code?: any) => void;

    /**
      * The video id.
      */
    videoId: string;
}

/**
 * The props a manager takes from its host, as opposed to the ones it maps from
 * the redux state below.
 */
type IOwnProps = Pick<IProps, 'follower' | 'onFollowerError' | 'videoId'>;

/**
 * Manager of shared video.
 */
class AbstractVideoManager extends PureComponent<IProps> {
    throttledFireUpdateSharedVideoEvent: Function;

    /**
     * Initializes a new instance of AbstractVideoManager.
     *
     * @param {IProps} props - Component props.
     * @returns {void}
     */
    constructor(props: IProps) {
        super(props);

        this.throttledFireUpdateSharedVideoEvent = throttle(this.fireUpdateSharedVideoEvent.bind(this), 5000);

        // selenium tests handler
        if (!props.follower) {
            window._sharedVideoPlayer = this;
        }
    }

    /**
     * Implements React Component's componentDidMount.
     *
     * @inheritdoc
     */
    override componentDidMount() {
        if (this.props.follower) {
            this.syncFollower();
        } else {
            this.props._dockToolbox(true);
            this.processUpdatedProps();
        }
    }

    /**
     * Implements React Component's componentDidUpdate.
     *
     * @inheritdoc
     */
    override componentDidUpdate(prevProps: IProps) {
        const { _videoUrl, follower } = this.props;

        if (!follower && prevProps._videoUrl !== _videoUrl) {
            sendAnalytics(createEvent('started'));
        }

        this.processUpdatedProps();
    }

    /**
     * Implements React Component's componentWillUnmount.
     *
     * @inheritdoc
     */
    override componentWillUnmount() {
        if (!this.props.follower) {
            sendAnalytics(createEvent('stopped'));
            this.props._dockToolbox(false);
        }

        if (this.dispose) {
            this.dispose();
        }
    }

    /**
     * Processes new properties.
     *
     * @returns {void}
     */
    processUpdatedProps() {
        const { _status, _time, _isOwner, _muted, follower } = this.props;

        if (_isOwner) {
            return;
        }

        const playerTime = this.getTime();

        if (shouldSeekToPosition(Number(_time), Number(playerTime))) {
            this.seek(Number(_time));
        }

        if (this.getPlaybackStatus() !== _status) {
            if (_status === PLAYBACK_STATUSES.PLAYING) {
                this.play();
            }

            if (_status === PLAYBACK_STATUSES.PAUSED) {
                this.pause();
            }
        }

        if (follower) {
            // A follower plays no audio (the audio stays with the main
            // window's player), so it is kept muted instead of following the
            // shared muted state.
            if (!this.isMuted()) {
                this.mute();
            }
        } else if (this.isMuted() !== _muted) {
            if (_muted) {
                this.mute();
            } else {
                this.unMute();
            }
        }
    }

    /**
     * Starts a follower player in sync with the meeting's shared state. A
     * follower must not start playing a video the meeting has paused: doing so
     * desyncs silently, because a paused video sends no further status updates
     * and nothing would ever correct it. Everything else (seeking to the shared
     * position, staying muted) is left to processUpdatedProps.
     *
     * Called both on mount and, for players created asynchronously (the YouTube
     * iframe API), once the player is ready; it is safe to run twice.
     *
     * @returns {void}
     */
    syncFollower() {
        // Not PLAYING vs. PAUSED: a video that was just shared is in the
        // "start" state, which processUpdatedProps does not act on, and a
        // follower opened at that moment should play.
        if (this.props._status !== PLAYBACK_STATUSES.PAUSED) {
            this.play();
        }

        this.processUpdatedProps();
    }

    /**
     * Handle video error.
     *
     * @param {Object|undefined} e - The error returned by the API or none.
     * @returns {void}
     */
    onError(e?: any) {
        const { follower, onFollowerError } = this.props;

        logger.error(`Error in the ${follower ? 'follower ' : ''}video player`, e?.data,
            e?.data ? 'Check error code at https://developers.google.com/youtube/iframe_api_reference#onError' : '');

        // An error in a follower player must not tear down the shared video
        // for the whole meeting (stopSharedVideo resets it when the local
        // participant is the owner); its host reports it instead, so the
        // failure does not read as an unexplained black screen.
        if (follower) {
            onFollowerError?.(e?.data);

            return;
        }

        this.props._stopSharedVideo();
        this.props._displayWarning();
    }

    /**
     * Handle video playing.
     *
     * @returns {void}
     */
    onPlay() {
        // A follower only observes: no analytics, no status updates, no
        // mic-mute side effects.
        if (this.props.follower) {
            return;
        }

        this.smartAudioMute();
        sendAnalytics(createEvent('play'));
        this.fireUpdateSharedVideoEvent();
    }

    /**
     * Handle video paused.
     *
     * @returns {void}
     */
    onPause() {
        if (this.props.follower) {
            return;
        }

        sendAnalytics(createEvent('paused'));
        this.fireUpdateSharedVideoEvent();
    }

    /**
     * Handle volume changed.
     *
     * @returns {void}
     */
    onVolumeChange() {
        if (this.props.follower) {
            return;
        }

        const volume = this.getVolume();
        const muted = this.isMuted();

        if (Number(volume) > 0 && !muted) {
            this.smartAudioMute();
        }

        sendAnalytics(createEvent(
            'volume.changed',
            {
                volume,
                muted
            }));

        this.fireUpdatePlayingVideoEvent();
    }

    /**
     * Handle changes to the shared playing video.
     *
     * @returns {void}
     */
    fireUpdatePlayingVideoEvent() {
        if (this.getPlaybackStatus() === PLAYBACK_STATUSES.PLAYING) {
            this.fireUpdateSharedVideoEvent();
        }
    }

    /**
     * Dispatches an update action for the shared video.
     *
     * @returns {void}
     */
    fireUpdateSharedVideoEvent() {
        const { _isOwner } = this.props;

        if (!_isOwner) {
            return;
        }

        const status = this.getPlaybackStatus();

        if (!Object.values(PLAYBACK_STATUSES).includes(status ?? '')) {
            return;
        }

        const {
            _ownerId,
            _setSharedVideoStatus,
            _videoUrl
        } = this.props;

        _setSharedVideoStatus({
            videoUrl: _videoUrl,
            status,
            time: this.getTime(),
            ownerId: _ownerId,
            muted: this.isMuted()
        });
    }

    /**
     * Indicates if the player volume is currently on. This will return true if
     * we have an available player, which is currently in a PLAYING state,
     * which isn't muted and has it's volume greater than 0.
     *
     * @returns {boolean} Indicating if the volume of the shared video is
     * currently on.
     */
    isSharedVideoVolumeOn() {
        return this.getPlaybackStatus() === PLAYBACK_STATUSES.PLAYING
                && !this.isMuted()
                && Number(this.getVolume()) > 0;
    }

    /**
     * Smart mike mute. If the mike isn't currently muted and the shared video
     * volume is on we mute the mike.
     *
     * @returns {void}
     */
    smartAudioMute() {
        const { _isLocalAudioMuted, _muteLocal } = this.props;

        if (!_isLocalAudioMuted
            && this.isSharedVideoVolumeOn()) {
            sendAnalytics(createEvent('audio.muted'));
            _muteLocal(true);
        }
    }

    /**
     * Seeks video to provided time.
     *
     * @param {number} _time - Time to seek to.
     * @returns {void}
     */
    seek(_time: number) {
        // to be implemented by subclass
    }

    /**
     * Indicates the playback state of the video.
     *
     * @returns {string}
     */
    getPlaybackStatus(): string | undefined {
        return;
    }

    /**
     * Indicates whether the video is muted.
     *
     * @returns {boolean}
     */
    isMuted(): boolean | undefined {
        return;
    }

    /**
     * Retrieves current volume.
     *
     * @returns {number}
     */
    getVolume() {
        return 1;
    }

    /**
     * Plays video.
     *
     * @returns {void}
     */
    play() {
        // to be implemented by subclass
    }

    /**
     * Pauses video.
     *
     * @returns {void}
     */
    pause() {
        // to be implemented by subclass
    }

    /**
     * Mutes video.
     *
     * @returns {void}
     */
    mute() {
        // to be implemented by subclass
    }

    /**
     * Unmutes video.
     *
     * @returns {void}
     */
    unMute() {
        // to be implemented by subclass
    }

    /**
     * Retrieves current time.
     *
     * @returns {number}
     */
    getTime() {
        return 0;
    }

    /**
     * Disposes current video player.
     *
     * @returns {void}
     */
    dispose() {
        // to be implemented by subclass
    }
}


export default AbstractVideoManager;

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The component's own props.
 * @returns {IProps}
 */
export function _mapStateToProps(state: IReduxState, ownProps: IOwnProps) {
    const { ownerId, status, time, videoUrl, muted } = state['features/shared-video'];
    const localParticipant = getLocalParticipant(state);
    const _isLocalAudioMuted = isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.AUDIO);

    return {
        _conference: getCurrentConference(state),
        _isLocalAudioMuted,

        // A follower never acts as the controlling player, even when the
        // local participant owns the shared video: ownership stays with the
        // main window's player, and the follower tracks the shared state like
        // any remote participant.
        _isOwner: !ownProps.follower && ownerId === localParticipant?.id,
        _muted: muted,
        _ownerId: ownerId,
        _status: status,
        _time: time,
        _videoUrl: videoUrl
    };
}

/**
 * Maps part of the props of this component to Redux actions.
 *
 * @param {Function} dispatch - The Redux dispatch function.
 * @returns {IProps}
 */
export function _mapDispatchToProps(dispatch: IStore['dispatch']) {
    return {
        _displayWarning: () => {
            dispatch(showWarningNotification({
                titleKey: 'dialog.shareVideoLinkError'
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));
        },
        _dockToolbox: (value: boolean) => {
            dispatch(dockToolbox(value));
        },
        _stopSharedVideo: () => {
            dispatch(stopSharedVideo());
        },
        _muteLocal: (value: boolean) => {
            dispatch(muteLocal(value, MEDIA_TYPE.AUDIO));
        },
        _setSharedVideoStatus: ({ videoUrl, status, time, ownerId, muted }: any) => {
            dispatch(setSharedVideoStatus({
                videoUrl,
                status,
                time,
                ownerId,
                muted
            }));
        }
    };
}
