import React, { Component } from 'react';
import { connect } from 'react-redux';

import { createAudioPlayErrorEvent, createAudioPlaySuccessEvent } from '../../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../../analytics/functions';
import { IReduxState } from '../../../../app/types';
import { DEFAULT_ORIGINAL_VOLUME } from '../../../../audio-translation/constants';
import { getDuckedVolumeForParticipant, shouldDuckOriginalAudio }
    from '../../../../audio-translation/functions';
import { browser } from '../../../lib-jitsi-meet';
import { ITrack } from '../../../tracks/types';
import logger from '../../logger';

// iOS (WebKit) ignores programmatic HTMLMediaElement.volume — it is under the user's hardware control, so
// assigning it is a no-op. Ducking therefore can't lower the volume there; we fall back to muting the
// original entirely while its translation plays. `element.muted` IS honoured on iOS.
const IS_IOS_BROWSER = browser.isIosBrowser();

/**
 * The type of the React {@code Component} props of {@link AudioTrack}.
 */
interface IProps {

    /**
     * Whether this track's original audio is currently ducked because its translated counterpart is playing.
     * On iOS, where element volume cannot be lowered, this causes the element to be muted instead.
     */
    _ducked?: boolean;

    /**
     * Represents muted property of the underlying audio element.
     */
    _muted?: boolean;

    /**
     * Represents volume property of the underlying audio element.
     */
    _volume?: number | boolean;

    /**
     * The audio track.
     */
    audioTrack?: ITrack;

    /**
     * Used to determine the value of the autoplay attribute of the underlying
     * audio element.
     */
    autoPlay: boolean;

    /**
     * The value of the id attribute of the audio element.
     */
    id: string;

    /**
     * The ID of the participant associated with the audio element.
     */
    participantId: string;
}

/**
 * The React/Web {@link Component} which is similar to and wraps around {@code HTMLAudioElement}.
 */
class AudioTrack extends Component<IProps> {
    /**
     * Reference to the HTML audio element, stored until the file is ready.
     */
    _ref: React.RefObject<HTMLAudioElement>;

    /**
     * The current timeout ID for attach or play retries. Shared so that
     * {@link _detachTrack} can cancel whichever retry is pending.
     */
    _retryTimeout: number | undefined;

    /**
     * Tracks how many full re-attach cycles (attach retries + play retries exhausted) have occurred
     * to prevent infinite recovery loops.
     */
    _reattachCount = 0;

    /**
     * Default values for {@code AudioTrack} component's properties.
     *
     * @static
     */
    static defaultProps = {
        autoPlay: true,
        id: ''
    };


    /**
     * Creates new <code>Audio</code> element instance with given props.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._errorHandler = this._errorHandler.bind(this);
        this._ref = React.createRef();
        this._play = this._play.bind(this);
    }


    /**
     * Attaches the audio track to the audio element and plays it.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        this._attachTrack(this.props.audioTrack);

        if (this._ref?.current) {
            const audio = this._ref?.current;
            const { _volume } = this.props;

            if (typeof _volume === 'number') {
                audio.volume = _volume;
            }

            audio.muted = this._isMuted(this.props);

            // @ts-ignore
            audio.addEventListener('error', this._errorHandler);
        } else { // This should never happen
            logger.error(`The react reference is null for AudioTrack ${this.props?.id}`);
        }
    }

    /**
     * Remove any existing associations between the current audio track and the
     * component's audio element.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentWillUnmount() {
        this._detachTrack(this.props.audioTrack);

        // @ts-ignore
        this._ref?.current?.removeEventListener('error', this._errorHandler);
    }

    /**
     * This component's updating is blackboxed from React to prevent re-rendering of the audio
     * element, as we set all the properties manually.
     *
     * @inheritdoc
     * @returns {boolean} - False is always returned to blackbox this component
     * from React.
     */
    override shouldComponentUpdate(nextProps: IProps) {
        const currentJitsiTrack = this.props.audioTrack?.jitsiTrack;
        const nextJitsiTrack = nextProps.audioTrack?.jitsiTrack;

        if (currentJitsiTrack !== nextJitsiTrack) {
            this._detachTrack(this.props.audioTrack);
            this._attachTrack(nextProps.audioTrack);
        }

        if (this._ref?.current) {
            const audio = this._ref?.current;
            const currentVolume = audio.volume;
            const nextVolume = nextProps._volume;

            if (typeof nextVolume === 'number' && !isNaN(nextVolume) && currentVolume !== nextVolume) {
                if (nextVolume === 0) {
                    logger.debug(`Setting audio element ${nextProps?.id} volume to 0`);
                }
                audio.volume = nextVolume;
            }

            const currentMuted = audio.muted;
            const nextMuted = this._isMuted(nextProps);

            if (currentMuted !== nextMuted) {
                logger.debug(`Setting audio element ${nextProps?.id} muted to ${nextMuted}`);

                audio.muted = nextMuted;
            }
        }

        return false;
    }

    /**
     * Computes the effective muted state of the audio element: muted when the conference is joined silently
     * ({@code _muted}), or — on iOS, where the volume cannot be lowered — while the track is ducked because
     * its translation is playing.
     *
     * @param {IProps} props - The props to evaluate.
     * @returns {boolean}
     */
    _isMuted(props: IProps) {
        return Boolean(props._muted) || (IS_IOS_BROWSER && Boolean(props._ducked));
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { autoPlay, id } = this.props;

        return (
            <audio
                autoPlay = { autoPlay }
                id = { id }
                ref = { this._ref } />
        );
    }

    /**
     * Calls into the passed in track to associate the track with the component's audio element.
     *
     * @param {Object} track - The redux representation of the {@code JitsiLocalTrack}.
     * @param {number} retryCount - The number of previously failed attach retries.
     * @private
     * @returns {void}
     */
    _attachTrack(track?: ITrack, retryCount = 0) {
        const { id } = this.props;

        if (!track?.jitsiTrack) {
            logger.warn(`Attach is called on audio element ${id} without tracks passed!`);

            return;
        }

        if (!this._ref?.current) {
            logger.warn(`Attempting to attach track ${track?.jitsiTrack} on AudioTrack ${id} without reference!`);

            return;
        }

        track.jitsiTrack.attach(this._ref.current)
            .then(() => {
                if (retryCount !== 0) {
                    logger.info(`Successfully attached audio track on element ${id} after ${retryCount} retries`);
                }
                this._play();
            })
            .catch((error: Error) => {
                logger.error(
                    `Attaching the remote track ${track.jitsiTrack} to audio with id ${id} has failed with `,
                    error);

                if (retryCount < 3) {
                    this._retryTimeout = window.setTimeout(() => {
                        this._attachTrack(track, retryCount + 1);
                    }, 1000);
                } else {
                    logger.error(`Failed to attach audio track on element ${id} after ${retryCount} retries`);
                }
            });
    }

    /**
     * Removes the association to the component's audio element from the passed
     * in redux representation of jitsi audio track.
     *
     * @param {Object} track -  The redux representation of the {@code JitsiLocalTrack}.
     * @private
     * @returns {void}
     */
    _detachTrack(track?: ITrack) {
        if (this._ref?.current && track?.jitsiTrack) {
            clearTimeout(this._retryTimeout);
            this._retryTimeout = undefined;
            track.jitsiTrack.detach(this._ref.current);
        }
    }

    /**
     * Reattaches the audio track to the underlying HTMLAudioElement when an 'error' event is fired.
     *
     * @param {Error} error - The error event fired on the HTMLAudioElement.
     * @returns {void}
     */
    _errorHandler(error: Error) {
        logger.error(`Error ${error?.message} called on audio track ${this.props.audioTrack?.jitsiTrack}. `
            + 'Attempting to reattach the audio track to the element and execute play on it');
        this._detachTrack(this.props.audioTrack);
        this._attachTrack(this.props.audioTrack);
    }

    /**
     * Plays the underlying HTMLAudioElement.
     *
     * @param {number} retries - The number of previously failed retries.
     * @returns {void}
     */
    _play(retries = 0) {
        const { autoPlay, id } = this.props;

        if (!this._ref?.current) {
            // nothing to play.
            logger.warn(`Attempting to call play on AudioTrack ${id} without reference!`);

            return;
        }

        if (autoPlay) {
            // Ensure the audio gets play() called on it. This may be necessary in the
            // case where the local video container was moved and re-attached, in which
            // case the audio may not autoplay.
            this._ref.current.play()
            .then(() => {
                if (retries !== 0) {
                    // success after some failures
                    this._retryTimeout = undefined;
                    sendAnalytics(createAudioPlaySuccessEvent(id));
                    logger.info(`Successfully played audio track! retries: ${retries}`);
                }
                this._reattachCount = 0;
            }, e => {
                logger.error(`Failed to play audio track on audio element ${id}! retry: ${retries} ; Error:`, e);

                if (retries < 3) {
                    this._retryTimeout = window.setTimeout(() => this._play(retries + 1), 1000);

                    if (retries === 0) {
                        // send only 1 error event.
                        sendAnalytics(createAudioPlayErrorEvent(id));
                    }
                } else {
                    this._retryTimeout = undefined;

                    // Play retries exhausted — re-attach the track and try again (once).
                    if (this._reattachCount < 1) {
                        this._reattachCount++;
                        logger.warn(`Play retries exhausted for audio element ${id}, re-attaching track`);
                        this._detachTrack(this.props.audioTrack);
                        this._attachTrack(this.props.audioTrack);
                    } else {
                        logger.error(`Audio recovery failed for element ${id} after re-attach`);
                    }
                }
            });
        }
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code AudioTrack}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { participantsVolume } = state['features/filmstrip'];
    const audioTranslationConfigured = Boolean(state['features/base/config'].audioTranslation);

    let _volume: number | boolean | undefined = participantsVolume[ownProps.participantId];

    // Driven by actual translated-audio presence, not isAudioTranslationAvailable: ducking follows the
    // media, and must not un-duck mid-playback on a permission/flag change.
    const sourceName: string | undefined = ownProps.audioTrack?.jitsiTrack?.getSourceName?.();
    const ducked = shouldDuckOriginalAudio(state, sourceName, ownProps.participantId);

    if (ducked) {
        _volume = getDuckedVolumeForParticipant(state, ownProps.participantId);
    } else if (audioTranslationConfigured && _volume === undefined) {
        // Restore full volume after ducking (config presence, not enabled, so a mid-call disable un-ducks).
        _volume = DEFAULT_ORIGINAL_VOLUME;
    }

    return {
        _ducked: ducked,
        _muted: state['features/base/config'].startSilent,
        _volume
    };
}

export default connect(_mapStateToProps)(AudioTrack);
