import throttle from 'lodash/throttle';
import { PureComponent } from 'react';

import { IReduxState, IStore } from '../../../app/types';
import { getCurrentConference } from '../../../base/conference/functions';
import { IJitsiConference } from '../../../base/conference/reducer';
import { getLocalParticipant } from '../../../base/participants/functions';
import { setSharedVideoStatus } from '../../actions.any';
import { PLAYBACK_STATUSES } from '../../constants';

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
 * The type of the React {@link Component} props of {@link AbstractVideoManager}.
 */
export interface IProps {

    /**
     * The current conference.
     */
    _conference?: IJitsiConference;

    /**
     * Is the video shared by the local user.
     *
     * @private
     */
    _isOwner: boolean;

    /**
     * The shared video owner id.
     */
    _ownerId?: string;

    /**
     * The shared video status.
     */
    _status?: string;

    /**
     * Seek time in seconds.
     *
     */
    _time: number;

    /**
     * The video url.
     */
    _videoUrl?: string;

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
      * The player's height.
    */
    height: number;

    /**
      * The video id.
    */
    videoId: string;

    /**
      * The player's width.
    */
    width: number;
}

/**
 * Manager of shared video.
 */
abstract class AbstractVideoManager<S=void> extends PureComponent<IProps, S> {
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
    }

    /**
     * Implements React Component's componentDidMount.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this.processUpdatedProps();
    }

    /**
     * Implements React Component's componentDidUpdate.
     *
     * @inheritdoc
     */
    componentDidUpdate() {
        this.processUpdatedProps();
    }

    /**
     * Implements React Component's componentWillUnmount.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        if (this.dispose) {
            this.dispose();
        }
    }

    /**
     * Processes new properties.
     *
     * @returns {void}
     */
    async processUpdatedProps() {
        const { _status, _time, _isOwner } = this.props;

        if (_isOwner) {
            return;
        }

        const playerTime = await this.getTime();

        if (shouldSeekToPosition(_time, playerTime)) {
            this.seek(_time);
        }

        if (this.getPlaybackStatus() !== _status) {
            if (_status === PLAYBACK_STATUSES.PLAYING) {
                this.play();
            } else if (_status === PLAYBACK_STATUSES.PAUSED) {
                this.pause();
            }
        }
    }

    /**
     * Handle video playing.
     *
     * @returns {void}
     */
    onPlay() {
        this.fireUpdateSharedVideoEvent();
    }

    /**
     * Handle video paused.
     *
     * @returns {void}
     */
    onPause() {
        this.fireUpdateSharedVideoEvent();
    }

    /**
     * Dispatches an update action for the shared video.
     *
     * @returns {void}
     */
    async fireUpdateSharedVideoEvent() {
        const { _isOwner } = this.props;

        if (!_isOwner) {
            return;
        }

        const status = this.getPlaybackStatus();

        if (!Object.values(PLAYBACK_STATUSES).includes(status)) {
            return;
        }

        const time = await this.getTime();

        const {
            _ownerId,
            _videoUrl,
            dispatch
        } = this.props;

        dispatch(setSharedVideoStatus({
            videoUrl: _videoUrl ?? '',
            status,
            time,
            ownerId: _ownerId
        }));
    }

    /**
     * Seeks video to provided time.
     */
    abstract seek(time: number): void;

    /**
     * Indicates the playback state of the video.
     */
    abstract getPlaybackStatus(): string;

    /**
     * Plays video.
     */
    abstract play(): void;

    /**
     * Pauses video.
     *
     * @returns {void}
     */
    abstract pause(): void;

    /**
     * Retrieves current time.
     */
    abstract getTime(): number;

    /**
     * Disposes current video player.
     *
     * @returns {void}
     */
    dispose() {
        // optional abstract method to be implemented by sub-class
    }
}


export default AbstractVideoManager;

/**
 * Maps part of the Redux store to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
export function _mapStateToProps(state: IReduxState) {
    const { ownerId, status, time, videoUrl } = state['features/shared-video'];
    const localParticipant = getLocalParticipant(state);

    return {
        _conference: getCurrentConference(state),
        _isOwner: ownerId === localParticipant?.id,
        _ownerId: ownerId,
        _status: status,
        _time: Number(time),
        _videoUrl: videoUrl
    };
}
