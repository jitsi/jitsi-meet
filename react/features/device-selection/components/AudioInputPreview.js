import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { JitsiTrackEvents } from '../../base/lib-jitsi-meet';

/**
 * React component for displaying a audio level meter for a JitsiLocalTrack.
 */
class AudioInputPreview extends Component {
    /**
     * AudioInputPreview component's property types.
     *
     * @static
     */
    static propTypes = {
        /*
         * The JitsiLocalTrack to show an audio level meter for.
         */
        track: PropTypes.object
    };

    /**
     * Initializes a new AudioInputPreview instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            audioLevel: 0
        };

        this._updateAudioLevel = this._updateAudioLevel.bind(this);
    }

    /**
     * Starts listening for audio level updates after the initial render.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._listenForAudioUpdates(this.props.track);
    }

    /**
     * Stops listening for audio level updates on the old track and starts
     * listening instead on the new track.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillReceiveProps(nextProps) {
        if (nextProps.track !== this.props.track) {
            this._listenForAudioUpdates(nextProps.track);
            this._updateAudioLevel(0);
        }
    }

    /**
     * Unsubscribe from audio level updates.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        this._stopListeningForAudioUpdates();
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const audioMeterFill = {
            width: `${Math.floor(this.state.audioLevel * 100)}%`
        };

        return (
            <div className = 'audio-input-preview' >
                <div
                    className = 'audio-input-preview-level'
                    style = { audioMeterFill } />
            </div>
        );
    }

    /**
     * Starts listening for audio level updates from the library.
     *
     * @param {JitstiLocalTrack} track - The track to listen to for audio level
     * updates.
     * @private
     * @returns {void}
     */
    _listenForAudioUpdates(track) {
        this._stopListeningForAudioUpdates();

        track && track.on(
            JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED,
            this._updateAudioLevel);
    }

    /**
     * Stops listening to further updates from the current track.
     *
     * @private
     * @returns {void}
     */
    _stopListeningForAudioUpdates() {
        this.props.track && this.props.track.off(
            JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED,
            this._updateAudioLevel);
    }

    /**
     * Updates the internal state of the last know audio level. The level should
     * be between 0 and 1, as the level will be used as a percentage out of 1.
     *
     * @param {number} audioLevel - The new audio level for the track.
     * @private
     * @returns {void}
     */
    _updateAudioLevel(audioLevel) {
        this.setState({
            audioLevel
        });
    }
}

export default AudioInputPreview;
