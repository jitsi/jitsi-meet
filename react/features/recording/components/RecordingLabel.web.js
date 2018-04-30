import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';
import { JitsiRecordingStatus } from '../../base/lib-jitsi-meet';

import { RECORDING_TYPES } from '../constants';

/**
 * Implements a React {@link Component} which displays the current state of
 * conference recording. Currently it uses CSS to display itself automatically
 * when there is a recording state update.
 *
 * @extends {Component}
 */
class RecordingLabel extends Component {
    /**
     * {@code RecordingLabel} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not the filmstrip is currently visible or toggled to
         * hidden. Depending on the filmstrip state, different CSS classes will
         * be set to allow for adjusting of {@code RecordingLabel} positioning.
         */
        _filmstripVisible: PropTypes.bool,

        /**
         * Whether or not the conference is currently being recorded.
         */
        _isRecording: PropTypes.bool,

        /**
         * An object to describe the {@code RecordingLabel} content. If no
         * translation key to display is specified, the label will apply CSS to
         * itself so it can be made invisible.
         * {{
         *     centered: boolean,
         *     key: string,
         *     showSpinner: boolean
         * }}
         */
        _labelDisplayConfiguration: PropTypes.object,

        /**
         * Whether the recording feature is live streaming (jibri) or is file
         * recording (jirecon).
         */
        _recordingType: PropTypes.string,

        /**
         * Invoked to obtain translated string.
         */
        t: PropTypes.func
    };

    /**
     * Initializes a new {@code RecordingLabel} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            /**
             * Whether or not the filmstrip was not visible but has transitioned
             * in the latest component update to visible. This boolean is used
             * to set a class for position animations.
             *
             * @type {boolean}
             */
            filmstripBecomingVisible: false
        };
    }

    /**
     * Updates the state for whether or not the filmstrip is being toggled to
     * display after having being hidden.
     *
     * @inheritdoc
     * @param {Object} nextProps - The read-only props which this Component will
     * receive.
     * @returns {void}
     */
    componentWillReceiveProps(nextProps) {
        this.setState({
            filmstripBecomingVisible: nextProps._filmstripVisible
                && !this.props._filmstripVisible
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _isRecording,
            _labelDisplayConfiguration,
            _recordingType
        } = this.props;
        const { centered, key, showSpinner } = _labelDisplayConfiguration || {};

        const isVisible = Boolean(key);
        const rootClassName = [
            'video-state-indicator centeredVideoLabel',
            _isRecording ? 'is-recording' : '',
            isVisible ? 'show-inline' : '',
            centered ? '' : 'moveToCorner',
            this.state.filmstripBecomingVisible ? 'opening' : '',
            this.props._filmstripVisible
                ? 'with-filmstrip' : 'without-filmstrip'
        ].join(' ');

        return (
            <div
                className = { rootClassName }
                id = 'recordingLabel'>
                { _isRecording
                    ? <div className = 'recording-icon'>
                        <div className = 'recording-icon-background' />
                        <i
                            className = {
                                _recordingType === RECORDING_TYPES.JIBRI
                                    ? 'icon-live'
                                    : 'icon-rec' } />
                    </div>
                    : <div id = 'recordingLabelText'>
                        { this.props.t(key) }
                    </div> }
                { !_isRecording
                    && showSpinner
                    && <img
                        className = 'recordingSpinner'
                        id = 'recordingSpinner'
                        src = 'images/spin.svg' /> }
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code RecordingLabel}
 * component's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _filmstripVisible: boolean,
 *     _isRecording: boolean,
 *     _labelDisplayConfiguration: Object,
 *     _recordingType: string
 * }}
 */
function _mapStateToProps(state) {
    const { visible } = state['features/filmstrip'];
    const {
        labelDisplayConfiguration,
        recordingState,
        recordingType
    } = state['features/recording'];

    return {
        _filmstripVisible: visible,
        _isRecording: recordingState === JitsiRecordingStatus.ON,
        _labelDisplayConfiguration: labelDisplayConfiguration,
        _recordingType: recordingType
    };
}

export default translate(connect(_mapStateToProps)(RecordingLabel));
