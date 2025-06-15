import React, { Component } from 'react';
import { connect } from 'react-redux';

import { createAudioPlayErrorEvent, createAudioPlaySuccessEvent } from '../../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../../analytics/functions';
import { IReduxState } from '../../../../app/types';
import { getParticipantDisplayName } from '../../../participants/functions';
import { ITrack } from '../../../tracks/types';
import logger from '../../logger';

/**
 * Declare global variables for spatial audio
 */
declare global {
    interface Window {
        context: AudioContext;
        spatialAudio: boolean;
        audioTracks: NodeListOf<Element>;
    }
}

/**
 * The type of the React {@code Component} props of {@link AudioTrack}.
 */
interface IProps {

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

    /**
     * The display name of the participant associated with the audio element.
     */
    _participantDisplayName?: string;

    /**
     * Callback to invoke when the initial volume is set.
     */
    onInitialVolumeSet?: (volume: number) => void;
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
     * The current timeout ID for play() retries.
     */
    _playTimeout: number | undefined;

    /**
     * Web Audio API nodes for spatial processing
     */
    _source?: MediaElementAudioSourceNode | MediaStreamAudioSourceNode;
    _gainNode?: GainNode;
    _pannerNode?: PannerNode;
    _spatialAudio?: boolean;
    _trackIdx?: number;
    _trackLen?: number;

    /**
     * The interval ID for spatial audio monitoring
     */
    _spatialAudioInterval?: number;

    /**
     * Default values for {@code AudioTrack} component's properties.
     *
     * @static
     */
    static defaultProps = {
        autoPlay: false,
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
        this._setRef = this._setRef.bind(this);
    }


    /**
     * Attaches the audio track to the audio element and plays it.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        this._attachTrack(this.props.audioTrack);
        this.initContext();

        if (this._ref?.current) {
            const audio = this._ref?.current;
            const { _muted, _volume } = this.props;

            let stream = (audio as any).mozCaptureStream
                        ? (audio as any).mozCaptureStream()
                        : (audio as any).captureStream();
    
            if (stream?.active) {
                console.log(`Spatial-Audio [${this.props._participantDisplayName || this.props.participantId}]: Chrome browser detected, using MediaStreamSource`);
                this._source = window.context.createMediaStreamSource(stream);
            } else { // in the case of Firefox, streams are duplicated?
                console.log(`Spatial-Audio [${this.props._participantDisplayName || this.props.participantId}]: Firefox browser detected, using MediaElementSource`);
                audio.volume = 0;
                this._source = window.context.createMediaElementSource(audio);
                audio.play();
            }

            // Always refresh audio tracks list to get current participants
            window.audioTracks = document.querySelectorAll('.audio-track');
            console.log(`Spatial-Audio [${this.props._participantDisplayName || this.props.participantId}]: Found ${window.audioTracks.length} audio tracks`);

            // Index and length for the first time
            this._trackLen = window.audioTracks.length; 
            this._trackIdx = this.getIndex();
            console.log(`Spatial-Audio [${this.props._participantDisplayName || this.props.participantId}]: This track has index ${this._trackIdx} of ${this._trackLen}`);
            
            // Set up initial spatialization
            this.setupSpatial();
            this.updateSpatial();

            // Start monitoring spatial audio state changes
            this.startSpatialAudioMonitoring();

            if (typeof _volume === 'number') {
                // audio.volume = volume;
                if (this._gainNode) {
                    this._gainNode.gain.value = _volume;
                }
            }

            if (typeof _muted === 'boolean') {
                audio.muted = _muted;
            }

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
        this._source?.disconnect(); // disconnect old audio stream (prevents lingering audio)

        // Clear spatial audio monitoring interval
        if (this._spatialAudioInterval) {
            clearInterval(this._spatialAudioInterval);
        }

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

        if (window.context?.state === 'suspended') {
            console.warn('Spatial-Audio: AudioContext is suspended, attempting to resume');
            window.context.resume();
        }

        if (currentJitsiTrack !== nextJitsiTrack) {
            this._detachTrack(this.props.audioTrack);
            this._attachTrack(nextProps.audioTrack);
        }

        // Check if current track is hidden - if so, don't update!
        if (this._ref?.current) {
            const currentVolume = this._gainNode ? this._gainNode.gain.value : this._ref.current.volume;
            const nextVolume = nextProps._volume;

            if (typeof nextVolume === 'number' && !isNaN(nextVolume) && currentVolume !== nextVolume) {
                if (nextVolume === 0) {
                    logger.debug(`Setting audio element ${nextProps?.id} volume to 0`);
                }
                if (this._gainNode) {
                    this._gainNode.gain.value = nextVolume;
                } else {
                    this._ref.current.volume = nextVolume;
                }
            }

            const currentMuted = this._ref.current.muted;
            const nextMuted = nextProps._muted;

            if (typeof nextMuted === 'boolean' && currentMuted !== nextMuted) {
                logger.debug(`Setting audio element ${nextProps?.id} muted to ${nextMuted}`);

                this._ref.current.muted = nextMuted;
            }


            if (window.spatialAudio) {
                // Always refresh audio tracks to get current participants
                window.audioTracks = document.querySelectorAll('.audio-track');
                
                // Check if user is in a new position in queue
                const currentIndex = this._trackIdx;
                const currentLength = this._trackLen;

                // Update index
                const nextIndex = this.getIndex();
                const nextLength = window.audioTracks.length;
                
                console.log(`Spatial-Audio [${this.props._participantDisplayName || this.props.participantId}]: Current participants: ${nextLength}, this track index: ${nextIndex}`);
            }
        }

        return false;
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
                ref = { this._setRef } />
        );
    }

    /**
     * Calls into the passed in track to associate the track with the component's audio element.
     *
     * @param {Object} track - The redux representation of the {@code JitsiLocalTrack}.
     * @private
     * @returns {void}
     */
    _attachTrack(track?: ITrack) {
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
            .catch((error: Error) => {
                logger.error(
                    `Attaching the remote track ${track.jitsiTrack} to video with id ${id} has failed with `,
                    error);
            })
            .finally(() => {
                this._play();
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
            clearTimeout(this._playTimeout);
            this._playTimeout = undefined;
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
                    this._playTimeout = undefined;
                    sendAnalytics(createAudioPlaySuccessEvent(id));
                    logger.info(`Successfully played audio track! retries: ${retries}`);
                }
            }, e => {
                logger.error(`Failed to play audio track on audio element ${id}! retry: ${retries} ; Error:`, e);

                if (retries < 3) {
                    this._playTimeout = window.setTimeout(() => this._play(retries + 1), 1000);

                    if (retries === 0) {
                        // send only 1 error event.
                        sendAnalytics(createAudioPlayErrorEvent(id));
                    }
                } else {
                    this._playTimeout = undefined;
                }
            });
        }
    }

    /**
     * Sets the reference to the HTML audio element.
     *
     * @param {HTMLAudioElement} audioElement - The audio element.
     * @private
     * @returns {void}
     */
    _setRef(audioElement: HTMLAudioElement | null) {
        (this._ref as any).current = audioElement;
        const { onInitialVolumeSet } = this.props;

        if (this._ref?.current && this._gainNode && onInitialVolumeSet) {
            onInitialVolumeSet(this._gainNode.gain.value);
        }
    }

    /**
     * Set up required variables for WebAudio spatialization
     * Note: This doesn't set up location of sounds (done in update)
     * 
     * @returns {void}
     */
    setupSpatial = () => {
        // setup listener once, one per context
        if (window.context.listener) {
            const listener = window.context.listener;

            if ((listener as any).forwardX) {
                (listener as any).forwardX.value = 0;
                (listener as any).forwardY.value = 0;
                (listener as any).forwardZ.value = -1;
                (listener as any).upX.value = 0;
                (listener as any).upY.value = 1;
                (listener as any).upZ.value = 0;
            } else {
                (listener as any).setOrientation(0, 0, -1, 0, 1, 0);
            }

            if ((listener as any).positionX) {
                (listener as any).positionX.value = 0; // horizontal
                (listener as any).positionY.value = 0; // vertical
                (listener as any).positionZ.value = 1; // depth
            } else {
                (listener as any).setPosition(0, 0, 1);
            }
        }

        // create and link nodes
        this._gainNode = window.context.createGain();
        this._pannerNode = window.context.createPanner();

        // setup source location
        this._pannerNode.panningModel = 'HRTF';
        this._pannerNode.distanceModel = 'inverse';
        this._pannerNode.refDistance = 1;
        this._pannerNode.maxDistance = 10000;
        this._pannerNode.rolloffFactor = 1;
        this._pannerNode.coneInnerAngle = 360;
        this._pannerNode.coneOuterAngle = 0;
        this._pannerNode.coneOuterGain = 0;
        (this._pannerNode as any).scale = 1;

        if ((this._pannerNode as any).orientationX) {
            (this._pannerNode as any).orientationX.value = 1; // horizontal (should not matter without a cone)
            (this._pannerNode as any).orientationY.value = 0; // vertical
            (this._pannerNode as any).orientationZ.value = 0; // depth
        } else {
            (this._pannerNode as any).setOrientation(1, 0, 0);
        }

        // Set spatial audio state and connect appropriate graph
        this._spatialAudio = window.spatialAudio;

        // Connect the appropriate audio chain based on initial state
        if (this._spatialAudio) {
            // Start with spatial audio enabled
            this._source?.connect(this._pannerNode);
            this._pannerNode.connect(this._gainNode);
            console.log(`Spatial-Audio [${this.props._participantDisplayName || this.props.participantId}]: Initial setup with spatial audio chain`);
        } else {
            // Start with mono audio (bypass panner)
            this._source?.connect(this._gainNode);
            console.log(`Spatial-Audio [${this.props._participantDisplayName || this.props.participantId}]: Initial setup with mono audio chain`);
        }

        this._gainNode.connect(window.context.destination);
    }

    /**
     * Update location of audio stream
     *
     * @returns {void}
     */
    updateSpatial = () => {
        // change location of source when its an update
        console.log(`Spatial-Audio [${this.props._participantDisplayName || this.props.participantId}]: Updating panner position`);

        const [xPos, yPos] = this.calcLocation();
        const scale = (this._pannerNode as any)?.scale || 1;

        // set x, y position
        if ((this._pannerNode as any)?.positionX) {
            (this._pannerNode as any).positionX.value = xPos * scale;
            (this._pannerNode as any).positionY.value = yPos * scale;
            (this._pannerNode as any).positionZ.value = 0;
        } else {
            (this._pannerNode as any)?.setPosition(xPos * scale, yPos * scale, 0);
        }
        
        console.log(`Spatial-Audio [${this.props._participantDisplayName || this.props.participantId}]: Set panner position to x=${xPos * scale}, y=${yPos * scale}, z=0`);
    }

    /**
     * Initializes Web Audio context
     *
     * @returns {void}
     */
    initContext = () => {
        if (window.context) {
            console.log('Spatial-Audio: AudioContext already exists');
        } else {
            window.context = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
            console.warn('Spatial-Audio: Creating new AudioContext');
        }

        // Sets both global and local states initially
        if (typeof(window.spatialAudio) === 'undefined') {
            console.warn('Spatial-Audio: Global spatialAudio state not initialized, setting to false');
            window.spatialAudio = false;
        }
        
        console.log('Spatial-Audio: Initial spatial audio state:', window.spatialAudio);
    }

    /**
     * Get index of audio stream
     *
     * @returns {number}
     */
    getIndex = (): number => {
        let i = 0;

        if (window.audioTracks.length > 1) {
            try {
                for (const item of window.audioTracks) {
                    if (item.firstElementChild?.id === this._ref?.current?.id) {
                        return i;
                    } 
                    i++;
                }
                console.warn(`Spatial-Audio [${this.props._participantDisplayName || this.props.participantId}]: Track index not found for ${this._ref?.current?.id}`);
                return 0;
            } catch (err) {
                console.warn(`Spatial-Audio [${this.props._participantDisplayName || this.props.participantId}]: Error getting track index:`, err);
                return 0;
            }
        } else {
            return 0;
        }
    }

    /**
     * Calculate the location of a participant's audio stream
     *
     * @returns {[number, number]}
     */
    calcLocation = (): [number, number] => {
        const trackIndex = this._trackIdx || 0;
        const totalTracks = this._trackLen || 1;
        
        // Simple left-to-right positioning
        // First participant: far left (-2), last participant: far right (+2)
        let xPos = 0;
        if (totalTracks > 1) {
            xPos = ((trackIndex / (totalTracks - 1)) * 4) - 2; // Range: -2 to +2
        }
        
        const yPos = 0; // Keep all participants at same depth
        
        console.log(`Spatial-Audio [${this.props._participantDisplayName || this.props.participantId}]: Participant ${trackIndex + 1}/${totalTracks} positioned at x=${xPos.toFixed(2)}, y=${yPos}`);

        return [xPos, yPos];
    }

    /**
     * Start monitoring spatial audio state changes
     *
     * @returns {void}
     */
    startSpatialAudioMonitoring = () => {
        // Check every 200ms for spatial audio state changes
        const checkInterval = setInterval(() => {
            if (this._spatialAudio !== window.spatialAudio) {
                console.log(`Spatial-Audio [${this.props._participantDisplayName || this.props.participantId}]: State change detected in monitoring:`, window.spatialAudio);
                this._spatialAudio = window.spatialAudio;
                this.switchCondition();
            }
        }, 200);
        
        // Store interval ID to clear on unmount
        this._spatialAudioInterval = checkInterval;
        console.log(`Spatial-Audio [${this.props._participantDisplayName || this.props.participantId}]: Monitoring active, checking every 200ms`);
    }

    /**
     * Switches mono/spatial reproduction by dis/connecting nodes
     *
     * @returns {void}
     */
    switchCondition = () => {
        console.log(`Spatial-Audio [${this.props._participantDisplayName || this.props.participantId}]: Switching audio mode. Spatial enabled:`, this._spatialAudio);
        this._source?.disconnect();
        this._pannerNode?.disconnect();

        if (this._spatialAudio) {
            // Spatial audio enabled: use panner
            if (this._source && this._pannerNode && this._gainNode) {
                this._source.connect(this._pannerNode);
                this._pannerNode.connect(this._gainNode);
                console.log(`Spatial-Audio [${this.props._participantDisplayName || this.props.participantId}]: Connected spatial audio chain`);
            }
        } else {
            // Spatial audio disabled: bypass panner
            if (this._source && this._gainNode) {
                this._source.connect(this._gainNode);
                console.log(`Spatial-Audio [${this.props._participantDisplayName || this.props.participantId}]: Connected mono audio chain (source → gain → destination)`);
            }
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

    return {
        _muted: state['features/base/config'].startSilent,
        _volume: participantsVolume[ownProps.participantId],
        _participantDisplayName: getParticipantDisplayName(state, ownProps.participantId)
    };
}

export default connect(_mapStateToProps)(AudioTrack);
