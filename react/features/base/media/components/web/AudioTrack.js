// @flow

import React, { Component } from 'react';

/**
 * The type of the React {@code Component} props of {@link Video}.
 */
type Props = {

    /**
     * The value of the id attribute of the video. Used by the torture tests to
     * locate video elements.
     */
    id: string,


    /**
     * The audio track.
     */
    audioTrack: ?Object,

    /**
     * Used to determine the value of the autoplay attribute of the underlying
     * audio element.
     */
    autoPlay: boolean,

    muted: ?Boolean,

    volume: ?number,

    onAudioElementReferenceChanged: Function
};

/**
 * The React/Web {@link Component} which is similar to and wraps around
 * {@code HTMLAudioElement} in order to facilitate cross-platform source code.
 */
export default class AudioTrack extends Component<Props> {
    /**
     * Reference to the HTML audio element, stored until the file is ready.
     */
    _ref: ?HTMLAudioElement;

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
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._setRef = this._setRef.bind(this);
    }


    /**
     * Invokes the library for rendering the video on initial display. Sets the
     * volume level to zero to ensure no sound plays.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._attachTrack(this.props.audioTrack);

        if (this._ref) {
            const { autoPlay, muted, volume } = this.props;

            if (autoPlay) {
                // Ensure the audio gets play() called on it. This may be necessary in the
                // case where the local video container was moved and re-attached, in which
                // case video does not autoplay.
                this._ref.play();
            }

            if (typeof volume === 'number') {
                this._ref.volume = volume;
            }

            if (typeof muted === 'boolean') {
                this._ref.muted = muted;
            }
        }
    }

    /**
     * Remove any existing associations between the current video track and the
     * component's video element.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        this._detachTrack(this.props.audioTrack);
    }

    /**
     * Updates the video display only if a new track is added. This component's
     * updating is blackboxed from React to prevent re-rendering of video
     * element, as the lib uses {@code track.attach(videoElement)} instead.
     *
     * @inheritdoc
     * @returns {boolean} - False is always returned to blackbox this component
     * from React.
     */
    shouldComponentUpdate(nextProps: Props) {
        const currentJitsiTrack = this.props.audioTrack && this.props.audioTrack.jitsiTrack;
        const nextJitsiTrack = nextProps.audioTrack && nextProps.audioTrack.jitsiTrack;

        if (currentJitsiTrack !== nextJitsiTrack) {
            this._detachTrack(this.props.audioTrack);
            this._attachTrack(nextProps.audioTrack);
        }

        if (this._ref) {
            const currentVolume = this._ref.volume;
            const nextVolume = nextProps.volume;

            if (typeof nextVolume === 'number' && currentVolume !== nextVolume) {
                this._ref.volume = nextVolume;
            }

            const currentMuted = this._ref.muted;
            const nextMuted = nextProps.muted;

            if (typeof nextMuted === 'boolean' && currentMuted !== nextVolume) {
                this._ref.muted = nextMuted;
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
    render() {
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
    _attachTrack(track) {
        if (!track || !track.jitsiTrack) {
            return;
        }

        track.jitsiTrack.attach(this._ref);
    }

    /**
     * Removes the association to the component's audio element from the passed
     * in redux representation of jitsi audio track.
     *
     * @param {Object} track -  The redux representation of the {@code JitsiLocalTrack}.
     * @private
     * @returns {void}
     */
    _detachTrack(track) {
        if (this._ref && track && track.jitsiTrack) {
            track.jitsiTrack.detach(this._ref);
        }
    }

    _setRef: (?HTMLAudioElement) => void;

    /**
     * Sets the reference to the HTML audio element.
     *
     * @param {HTMLAudioElement} audioElement - The HTML audio element instance.
     * @private
     * @returns {void}
     */
    _setRef(audioElement: ?HTMLAudioElement) {
        this._ref = audioElement;
        const { onAudioElementReferenceChanged } = this.props;

        if (this._ref && onAudioElementReferenceChanged) {
            onAudioElementReferenceChanged({ volume: this._ref.volume });
        }
    }
}
