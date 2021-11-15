/* @flow */
/* eslint-disable no-invalid-this */
import Logger from '@jitsi/logger';
import throttle from 'lodash/throttle';
import { PureComponent } from 'react';

import { sendAnalytics, createSharedVideoEvent as createEvent } from '../../../analytics';
import { getCurrentConference } from '../../../base/conference';
import { MEDIA_TYPE } from '../../../base/media';
import { getLocalParticipant } from '../../../base/participants';
import { isLocalTrackMuted } from '../../../base/tracks';
import { showWarningNotification } from '../../../notifications/actions';
import { dockToolbox } from '../../../toolbox/actions.web';
import { muteLocal } from '../../../video-menu/actions.any';
import { setSharedVideoStatus, stopSharedVideo } from '../../actions.any';
import { PLAYBACK_STATUSES } from '../../constants';

const logger = Logger.getLogger(__filename);

/**
 * Return true if the diffenrece between the two timees is larger than 5.
 *
 * @param {number} newTime - The current time.
 * @param {number} previousTime - The previous time.
 * @private
 * @returns {boolean}
*/
function shouldSeekToPosition(newTime, previousTime) {
    return Math.abs(newTime - previousTime) > 5;
}

/**
 * The type of the React {@link PureComponent} props of {@link AbstractVideoManager}.
 */
export type Props = {

    /**
     * The current coference.
     */
    _conference: Object,

    /**
     * Warning that indicates an incorect video url.
     */
    _displayWarning: Function,

    /**
     * Docks the toolbox.
     */
    _dockToolbox: Function,

    /**
     * Action to stop video sharing.
    */
    _stopSharedVideo: Function,

    /**
     * Indicates whether the local audio is muted.
    */
    _isLocalAudioMuted: boolean,

    /**
     * Is the video shared by the local user.
     *
     * @private
     */
    _isOwner: boolean,

    /**
     * Store flag for muted state.
     */
    _muted: boolean,

    /**
     * Mutes local audio track.
     */
    _muteLocal: Function,

    /**
     * The shared video owner id.
     */
    _ownerId: string,

    /**
     * Updates the shared video status.
     */
    _setSharedVideoStatus: Function,

    /**
     * The shared video status.
     */
     _status: string,

    /**
     * Seek time in seconds.
     *
     */
    _time: number,

    /**
     * The video url.
     */
     _videoUrl: string,

     /**
      * The video id.
      */
     videoId: string
}

/**
 * Manager of shared video.
 */
class AbstractVideoManager extends PureComponent<Props> {
    throttledFireUpdateSharedVideoEvent: Function;

    /**
     * Initializes a new instance of AbstractVideoManager.
     *
     * @returns {void}
     */
    constructor() {
        super();

        this.throttledFireUpdateSharedVideoEvent = throttle(this.fireUpdateSharedVideoEvent.bind(this), 5000);

        // selenium tests handler
        window._sharedVideoPlayer = this;
    }

    /**
     * Implements React Component's componentDidMount.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this.props._dockToolbox(true);
        this.processUpdatedProps();
    }

    /**
     * Implements React Component's componentDidUpdate.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: Props) {
        const { _videoUrl } = this.props;

        if (prevProps._videoUrl !== _videoUrl) {
            sendAnalytics(createEvent('started'));
        }

        this.processUpdatedProps();
    }

    /**
     * Implements React Component's componentWillUnmount.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        sendAnalytics(createEvent('stopped'));

        if (this.dispose) {
            this.dispose();
        }

        this.props._dockToolbox(false);
    }

    /**
     * Processes new properties.
     *
     * @returns {void}
     */
    processUpdatedProps() {
        const { _status, _time, _isOwner, _muted } = this.props;

        if (_isOwner) {
            return;
        }

        const playerTime = this.getTime();

        if (shouldSeekToPosition(_time, playerTime)) {
            this.seek(_time);
        }

        if (this.getPlaybackStatus() !== _status) {
            if (_status === PLAYBACK_STATUSES.PLAYING) {
                this.play();
            }

            if (_status === PLAYBACK_STATUSES.PAUSED) {
                this.pause();
            }
        }

        if (this.isMuted() !== _muted) {
            if (_muted) {
                this.mute();
            } else {
                this.unMute();
            }
        }
    }

    /**
     * Handle video error.
     *
     * @returns {void}
     */
    onError() {
        logger.error('Error in the video player');
        this.props._stopSharedVideo();
        this.props._displayWarning();
    }

    /**
     * Handle video playing.
     *
     * @returns {void}
     */
    onPlay() {
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
        sendAnalytics(createEvent('paused'));
        this.fireUpdateSharedVideoEvent();
    }

    /**
     * Handle volume changed.
     *
     * @returns {void}
     */
    onVolumeChange() {
        const volume = this.getVolume();
        const muted = this.isMuted();

        if (volume > 0 && !muted) {
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

        if (!Object.values(PLAYBACK_STATUSES).includes(status)) {
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
                && this.getVolume() > 0;
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
     * @param {number} time
     */
    seek: (time: number) => void;

    /**
     * Indicates the playback state of the video.
     */
    getPlaybackStatus: () => boolean;

    /**
     * Indicates whether the video is muted.
     */
    isMuted: () => boolean;

    /**
     * Retrieves current volume.
     */
    getVolume: () => number;

    /**
     * Plays video.
     */
    play: () => void;

    /**
     * Pauses video.
     */
    pause: () => void;

    /**
     * Mutes video.
     */
    mute: () => void;

    /**
     * Unmutes video.
     */
    unMute: () => void;

    /**
     * Retrieves current time.
     */
    getTime: () => number;

    /**
     * Disposes current video player.
     */
    dispose: () => void;
}


export default AbstractVideoManager;

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
export function _mapStateToProps(state: Object): $Shape<Props> {
    const { ownerId, status, time, videoUrl, muted } = state['features/shared-video'];
    const localParticipant = getLocalParticipant(state);
    const _isLocalAudioMuted = isLocalTrackMuted(state['features/base/tracks'], MEDIA_TYPE.AUDIO);

    return {
        _conference: getCurrentConference(state),
        _isLocalAudioMuted,
        _isOwner: ownerId === localParticipant.id,
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
 * @returns {Props}
 */
export function _mapDispatchToProps(dispatch: Function): $Shape<Props> {
    return {
        _displayWarning: () => {
            dispatch(showWarningNotification({
                titleKey: 'dialog.shareVideoLinkError'
            }));
        },
        _dockToolbox: value => {
            dispatch(dockToolbox(value));
        },
        _stopSharedVideo: () => {
            dispatch(stopSharedVideo());
        },
        _muteLocal: value => {
            dispatch(muteLocal(value, MEDIA_TYPE.AUDIO));
        },
        _setSharedVideoStatus: ({ videoUrl, status, time, ownerId, muted }) => {
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
