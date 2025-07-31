import React, { Component } from 'react';
import { connect } from 'react-redux';

import { createAudioPlayErrorEvent, createAudioPlaySuccessEvent } from '../../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../../analytics/functions';
import { IReduxState } from '../../../../app/types';
import { getParticipantDisplayName, getRemoteParticipants } from '../../../participants/functions';
import { ITrack } from '../../../tracks/types';
import logger from '../../logger';
import { getSpatialAudioManager, SpatialAudioDebug, ISpatialAudioSettings } from '../../../../spatial-audio';

/**
 * Declare global variables for backward compatibility
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
     * Timeout to avoid errors when the audio element is not ready.
     */
    _playTimeout: number | undefined;

    /**
     * Audio source node for Web Audio API
     */
    _source?: MediaElementAudioSourceNode | MediaStreamAudioSourceNode;

    /**
     * Track index for position calculation
     */
    _trackIdx?: number;

    /**
     * Spatial audio manager instance
     */
    private spatialAudioManager = getSpatialAudioManager();

    /**
     * Indicates if this participant has been registered with the spatial audio manager
     */
    private isRegisteredWithManager = false;

    /**
     * The default props of {@code AudioTrack}.
     */
    static defaultProps = {
        autoPlay: true,
        id: ''
    };

    /**
     * Initializes a new {@code AudioTrack} instance.
     *
     * @param {IProps} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this._ref = React.createRef();
    }

    /**
     * Starts playing the audio track.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        this._attachTrack(this.props.audioTrack);

        // Initialize backward compatibility
        this.initBackwardCompatibility();

        // Register with spatial audio manager
        this.registerWithSpatialAudioManager();

        // Listen for spatial audio settings changes
        this.spatialAudioManager.addEventListener('settingsUpdated', this.handleSpatialAudioSettingsChange);
        
        // Set initial volume based on current settings
        this.handleSpatialAudioSettingsChange({ settings: this.spatialAudioManager.getSettings() });

        if (this._ref.current) {
            this._ref.current.addEventListener('error', this._errorHandler);
        }
    }

    /**
     * Stops playing the audio track.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentWillUnmount() {
        // Unregister from spatial audio manager
        this.unregisterFromSpatialAudioManager();

        // Stop listening for settings changes
        this.spatialAudioManager.removeEventListener('settingsUpdated', this.handleSpatialAudioSettingsChange);

        this._detachTrack(this.props.audioTrack);

        clearTimeout(this._playTimeout);
    }

    /**
     * Determines if audio element needs to be updated.
     *
     * @param {IProps} nextProps - The new props.
     * @returns {boolean}
     */
    override shouldComponentUpdate(nextProps: IProps) {
        const currentJitsiTrack = this.props.audioTrack?.jitsiTrack;
        const nextJitsiTrack = nextProps.audioTrack?.jitsiTrack;

        return currentJitsiTrack !== nextJitsiTrack;
    }

    /**
     * Renders the component.
     *
     * @returns {ReactElement}
     */
    override render() {
        const {
            autoPlay,
            id,
            _muted: muted,
            _volume: volume
        } = this.props;

        return (
            <audio
                autoPlay = { autoPlay }
                className = 'audio-track'
                id = { id }
                muted = { muted }
                ref = { this._setRef } />
        );
    }

    /**
     * Attaches the passed track to the audio element and enables/disables it.
     *
     * @param {ITrack} track - The track to attach to the audio element.
     * @returns {void}
     */
    _attachTrack(track?: ITrack) {
        if (!track || !track.jitsiTrack) {
            return;
        }

        track.jitsiTrack.attach(this._ref.current)
            .then(() => {
                // Create audio source for spatial audio after successful attach
                this.createAudioSource();
            })
            .catch((error: Error) => {
                logger.error('Failed to attach track:', error);
            });
    }

    /**
     * Detaches the passed track from the audio element.
     *
     * @param {ITrack} track - The track to detach from the audio element.
     * @returns {void}
     */
    _detachTrack(track?: ITrack) {
        if (!track || !track.jitsiTrack) {
            return;
        }

        track.jitsiTrack.detach(this._ref.current);

        // Disconnect audio source
        this.disconnectAudioSource();
    }

    /**
     * Handles errors that occur when playing the audio element.
     *
     * @param {Error} error - The error that occurred.
     * @returns {void}
     */
    _errorHandler = (event: ErrorEvent | Error) => {
        const message = event instanceof Error ? event.message : event.message || 'Unknown error';
        logger.error('Failed to play audio track', message);
        sendAnalytics(createAudioPlayErrorEvent());
    }

    /**
     * Plays the underlying audio element.
     *
     * @param {number} retries - Number of retries when play fails.
     * @returns {void}
     */
    _play(retries = 0) {
        const { autoPlay } = this.props;

        if (!autoPlay) {
            return;
        }

        if (this._ref.current) {
            const { current: audio } = this._ref;

            if (audio.readyState >= 1) {
                const playPromise = audio.play();

                if (playPromise) {
                    playPromise
                        .then(() => {
                            sendAnalytics(createAudioPlaySuccessEvent());
                        })
                        .catch((error: Error) => this._errorHandler(error));
                }
            } else if (retries < 5) {
                this._playTimeout = window.setTimeout(() => this._play(retries + 1), 200);
            } else {
                this._errorHandler(new Error('Audio element failed to load.'));
            }
        }
    }

    /**
     * Sets the reference to the HTML audio element.
     *
     * @param {HTMLAudioElement} audioElement - The HTML audio element instance.
     * @returns {void}
     */
    _setRef = (audioElement: HTMLAudioElement | null) => {
        (this._ref as any).current = audioElement;

        if (audioElement) {
            audioElement.addEventListener('loadeddata', () => this._play(0));
            audioElement.addEventListener('error', this._errorHandler);
        }
    }

    /**
     * Initialize backward compatibility globals
     */
    private initBackwardCompatibility(): void {
        // Initialize AudioContext if not exists
        if (!window.context) {
            (window as any).context = this.spatialAudioManager.getAudioContext();
        }

        // Initialize spatial audio state
        if (typeof window.spatialAudio === 'undefined') {
            window.spatialAudio = this.spatialAudioManager.getSettings().enabled;
        }

        // Update audio tracks list
        window.audioTracks = document.querySelectorAll('.audio-track');
    }

    /**
     * Register this participant with the spatial audio manager
     * Now optimized to work with the synchronization system
     */
    private registerWithSpatialAudioManager(): void {
        if (this.isRegisteredWithManager) {
            console.log(`SpatialAudioManager: Participant ${this.props.participantId} already registered, skipping`);
            return;
        }

        // Calculate track index
        this._trackIdx = this.getTrackIndex();

        // Register/update participant (this will work with synchronized participants)
        // The spatial audio manager will either update an existing placeholder or add a new participant
        this.spatialAudioManager.addParticipant({
            participantId: this.props.participantId,
            displayName: this.props._participantDisplayName,
            isLocal: false, // Assuming remote participant for now
            isMuted: this.props._muted || false,
            trackIndex: this._trackIdx, // This might be ignored if participant is already synchronized
            source: this._source
        });

        this.isRegisteredWithManager = true;

        console.log(`SpatialAudioManager: Registered/updated participant ${this.props._participantDisplayName || this.props.participantId} with audio track`);
    }

    /**
     * Unregister this participant from the spatial audio manager
     */
    private unregisterFromSpatialAudioManager(): void {
        if (!this.isRegisteredWithManager) {
            return;
        }

        this.spatialAudioManager.removeParticipant(this.props.participantId);
        this.isRegisteredWithManager = false;

        console.log(`SpatialAudioManager: Unregistered participant ${this.props._participantDisplayName || this.props.participantId}`);
    }

    /**
     * Handler for spatial audio settings updates.
     * Controls HTML audio element volume to prevent double audio output.
     * CRITICAL: We use volume=0 for HTML element but keep it unmuted so MediaElementAudioSourceNode works.
     */
    private handleSpatialAudioSettingsChange = ({ settings }: { settings: ISpatialAudioSettings }): void => {
        const audioElement = this._ref.current;
        if (!audioElement) {
            console.log(`Spatial: No audio element found for ${this.props.participantId}`);
            return;
        }

        console.log(`Spatial: Handling settings change for ${this.props.participantId}, enabled: ${settings.enabled}`);

        if (settings.enabled) {
            // Spatial audio ON: Reduce HTML element volume but keep unmuted
            // This prevents browser audio output while allowing MediaElementAudioSourceNode to work
            audioElement.volume = 0.01; // Very low but not zero
            audioElement.muted = false;  // Keep unmuted for MediaElementAudioSourceNode
            console.log(`Spatial: Set HTML audio volume to 0.01 for ${this.props.participantId} (MediaElementAudioSourceNode should work)`);
        } else {
            // Spatial audio OFF: Use masterVolume setting for HTML audio playback
            audioElement.volume = settings.masterVolume; // Verwende masterVolume (0.7) statt 1.0
            audioElement.muted = false;
            console.log(`Spatial: Set HTML audio volume to ${settings.masterVolume} for ${this.props.participantId} (Standard mode)`);
        }
    }

    /**
     * Create audio source node for Web Audio API
     */
    private createAudioSource(): void {
        const audioElement = this._ref.current;
        if (!audioElement || this._source) {
            return;
        }

        try {
            const audioContext = this.spatialAudioManager.getAudioContext();
            
            if ((audioElement as any).audioSourceNode) {
                this._source = (audioElement as any).audioSourceNode;
            } else {
                // CRITICAL FIX: Use MediaStream for Chrome (independent of HTML element)
                let stream = (audioElement as any).captureStream 
                    ? (audioElement as any).captureStream(0)
                    : (audioElement as any).mozCaptureStream 
                    ? (audioElement as any).mozCaptureStream(0)
                    : null;

                if (stream && stream.active) {
                    // Chrome: MediaStreamSource - INDEPENDENT of HTML element volume!
                    console.log(`Spatial: Using MediaStreamSource for ${this.props.participantId}`);
                    this._source = audioContext.createMediaStreamSource(stream);
                } else {
                    // Firefox: MediaElementSource
                    console.log(`Spatial: Using MediaElementSource for ${this.props.participantId}`);
                    audioElement.volume = 0; // Mute HTML element for Firefox
                    this._source = audioContext.createMediaElementSource(audioElement);
                    audioElement.play().catch(e => console.log('Play failed:', e));
                }
                
                (audioElement as any).audioSourceNode = this._source;
            }
            
            if (this.isRegisteredWithManager && this._source) {
                this.spatialAudioManager.connectParticipantSource(this.props.participantId, this._source);
            }
            
        } catch (error) {
            console.warn(`Spatial: Failed to create audio source:`, error);
            this.tryCreateStreamSource();
        }
    }

    /**
     * Alternative method to create audio source using MediaStream
     */
    private tryCreateStreamSource(): void {
        const audioElement = this._ref.current;
        if (!audioElement) {
            return;
        }

        try {
            const audioContext = this.spatialAudioManager.getAudioContext();
            
            // Try to get MediaStream from audio element
            let stream = (audioElement as any).mozCaptureStream
                ? (audioElement as any).mozCaptureStream(0)
                : (audioElement as any).captureStream(0);

            if (stream && stream.active) {
                console.log(`SpatialAudioManager: Using MediaStream source for ${this.props.participantId}`);
                this._source = audioContext.createMediaStreamSource(stream);
                
                // Connect to spatial audio manager if participant is registered
                if (this.isRegisteredWithManager) {
                    this.spatialAudioManager.connectParticipantSource(this.props.participantId, this._source);
                }
                
                console.log(`SpatialAudioManager: Created MediaStream source for ${this.props._participantDisplayName || this.props.participantId}`);
            } else {
                console.warn(`SpatialAudioManager: No active MediaStream available for ${this.props.participantId}`);
            }
        } catch (error) {
            console.warn(`SpatialAudioManager: Failed to create MediaStream source for ${this.props.participantId}:`, error);
        }
    }

    /**
     * Disconnect audio source
     */
    private disconnectAudioSource(): void {
        if (this._source) {
            this._source.disconnect();
            this._source = undefined;
        }
    }

    /**
     * Get the track index for this participant
     */
    private getTrackIndex(): number {
        if (!this._ref.current) {
            return 0;
        }

        const audioTracks = document.querySelectorAll('.audio-track');
        for (let i = 0; i < audioTracks.length; i++) {
            if (audioTracks[i].id === this._ref.current.id) {
                return i;
            }
        }
        
        return 0;
    }

    // Legacy methods for backward compatibility
    
    /**
     * Legacy method - now handled by SpatialAudioManager
     * @deprecated Use SpatialAudioManager instead
     */
    setupSpatial = () => {
        console.warn('AudioTrack.setupSpatial is deprecated. Spatial audio is now handled by SpatialAudioManager.');
    }

    /**
     * Legacy method - now handled by SpatialAudioManager
     * @deprecated Use SpatialAudioManager instead
     */
    updateSpatial = () => {
        console.warn('AudioTrack.updateSpatial is deprecated. Spatial audio is now handled by SpatialAudioManager.');
    }

    /**
     * Legacy method for backward compatibility
     * @deprecated Use SpatialAudioManager instead
     */
    initContext = () => {
        this.initBackwardCompatibility();
    }

    /**
     * Legacy method for backward compatibility
     * @deprecated Use SpatialAudioManager instead
     */
    getIndex = (): number => {
        return this.getTrackIndex();
    }

    /**
     * Legacy method for backward compatibility
     * @deprecated Use SpatialAudioManager instead
     */
    calcLocation = (): [number, number] => {
        const participant = this.spatialAudioManager.getParticipant(this.props.participantId);
        if (participant) {
            return [participant.position.x, participant.position.y];
        }
        return [0, 0];
    }

    /**
     * Legacy method for backward compatibility
     * @deprecated Use SpatialAudioManager instead
     */
    checkAndRecalculatePositions = () => {
        // No-op - handled automatically by SpatialAudioManager
    }

    /**
     * Legacy method for backward compatibility
     * @deprecated Use SpatialAudioManager instead
     */
    startSpatialAudioMonitoring = () => {
        // No-op - handled automatically by SpatialAudioManager
    }

    /**
     * Legacy method for backward compatibility
     * @deprecated Use SpatialAudioManager instead
     */
    switchCondition = () => {
        const settings = this.spatialAudioManager.getSettings();
        window.spatialAudio = settings.enabled;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code AudioTrack} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { participantId } = ownProps;
    const participants = getRemoteParticipants(state);
    const participant = participants instanceof Map 
        ? participants.get(participantId)
        : Array.from(participants).find((p: any) => p.id === participantId);

    return {
        _participantDisplayName: getParticipantDisplayName(state, participantId),
        _muted: Boolean((participant as any)?.audioMuted)
    };
}

export default connect(_mapStateToProps)(AudioTrack);
