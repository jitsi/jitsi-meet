import React, { Component } from 'react';
import { connect } from 'react-redux';

import { translate } from '../../base/i18n';

import { STATUS } from '../constants';

const LIVE_STREAMING_RECORDING_TYPE = 'jibri';

/**
 * Translation keys to use for display in the UI when recording the conference
 * but not streaming live.
 *
 * @private
 * @type {Object}
 */
const RECORDING_TRANSLATION_KEYS = {
    failedToStartKey: 'recording.failedToStart',
    recordingErrorKey: 'recording.error',
    recordingOffKey: 'recording.off',
    recordingOnKey: 'recording.on',
    recordingPendingKey: 'recording.pending'
};

/**
 * Translation keys to use for display in the UI when the recording mode is
 * currently streaming live.
 *
 * @private
 * @type {Object}
 */
const STREAMING_TRANSLATION_KEYS = {
    failedToStartKey: 'liveStreaming.failedToStart',
    recordingErrorKey: 'liveStreaming.error',
    recordingOffKey: 'liveStreaming.off',
    recordingOnKey: 'liveStreaming.on',
    recordingPendingKey: 'liveStreaming.pending'
};

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
        _filmstripVisible: React.PropTypes.bool,

        /**
         * The current state of the recording feature. The state should
         * correspond to one enumerated in {@code STATUS}.
         */
        _recordingState: React.PropTypes.string,

        /**
         * The type of recording sessions in progress otherwise the component
         * will not display.
         */
        _recordingType: React.PropTypes.string,

        /**
         * Whether or not remote videos within the filmstrip are currently
         * visible. Depending on the visibility state, coupled with filmstrip
         * visibility, CSS classes will be set to allow for adjusting of
         * {@code RecordingLabel} positioning.
         */
        _remoteVideosVisible: React.PropTypes.bool,

        /**
         * Whether or not {@code RecordingLabel} should be visible, regardless
         * of the current recording state. If set to false, a CSS class will be
         * set to allow the component to be styled to visible.
         */
        _shouldDisplay: React.PropTypes.bool,

        /**
         * Invoked to obtain translated string.
         */
        t: React.PropTypes.func
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
            filmstripBecomingVisible: false,

            /**
             * A cache of the _recordingState prop. It is compared to the next
             * value of _recordingState on component update to identify from
             * which recording state a failure was encountered.
             *
             * @type {string|null}
             */
            previousRecordingState: null
        };
    }

    /**
     * Updates the state for whether or not the filmstrip is being toggled to
     * display after having being hidden and caches the previous recording
     * state.
     *
     * @inheritdoc
     * @param {Object} nextProps - The read-only props which this Component will
     * receive.
     * @returns {void}
     */
    componentWillReceiveProps(nextProps) {
        this.setState({
            previousRecordingState: this.props._recordingState,
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
        const { centered, key, showSpinner } = this._getDisplayConfiguration();
        const isVisible = this.props._shouldDisplay && Boolean(key);
        const rootClassName = [
            'video-state-indicator centeredVideoLabel',
            isVisible ? 'show-inline' : '',
            centered ? '' : 'moveToCorner',
            this.state.filmstripBecomingVisible ? 'opening' : '',
            this.props._filmstripVisible
                ? 'with-filmstrip' : 'without-filmstrip',
            this.props._remoteVideosVisible
                ? 'with-remote-videos' : 'without-remote-videos'
        ].join(' ');

        return (
            <span
                className = { rootClassName }
                id = 'recordingLabel'>
                <span id = 'recordingLabelText'>
                    { this.props.t(key) }
                </span>
                { showSpinner
                    ? <img
                        className = 'recordingSpinner'
                        id = 'recordingSpinner'
                        src = 'images/spin.svg' />
                    : null }
            </span>
        );
    }

    /**
     * Creates a configuration object describing how @{code RecordingLabel}
     * should be displayed -- the text content, loading spinner display, and
     * centered in parent.
     *
     * @private
     * @returns {Object}
     */
    _getDisplayConfiguration() {
        const { _recordingState, _recordingType } = this.props;
        const translationKeys = _recordingType === LIVE_STREAMING_RECORDING_TYPE
            ? STREAMING_TRANSLATION_KEYS : RECORDING_TRANSLATION_KEYS;

        switch (_recordingState) {
        case STATUS.ON:
        case STATUS.RETRYING:
            return {
                centered: false,
                key: translationKeys.recordingOnKey,
                showSpinner: _recordingState === STATUS.RETRYING
            };

        case STATUS.OFF:
        case STATUS.UNAVAILABLE:
        case STATUS.BUSY:
        case STATUS.FAILED:
            return {
                centered: true,
                key: this._wasInStartingState()
                    ? translationKeys.failedToStartKey
                    : translationKeys.recordingOffKey
            };

        case STATUS.PENDING:
            return {
                centered: true,
                key: translationKeys.recordingPendingKey
            };

        case STATUS.ERROR:
            return {
                centered: true,
                key: translationKeys.recordingErrorKey
            };

        // Return an empty configuration to indicate {@code RecordingLabel}
        // should not be displayed.
        case STATUS.AVAILABLE:
        default:
            return {};
        }
    }

    /**
     * Checks whether the recording state was in a PENDING or RETRYING status.
     *
     * @private
     * @returns {boolean} True if recording was previously starting up.
     */
    _wasInStartingState() {
        const { previousRecordingState } = this.state;

        return previousRecordingState === STATUS.PENDING
            || previousRecordingState === STATUS.RETRYING;
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
 *     _recordingState: string,
 *     _recordingType: string,
 *     _remoteVideosVisible: boolean,
 *     _shouldDisplay: boolean
 * }}
 */
function _mapStateToProps(state) {
    const { remoteVideosVisible, visible } = state['features/filmstrip'];
    const { displayRecordingLabel, recordingState }
        = state['features/recording'];

    return {
        /**
         * Whether or not the filmstrip is currently set to be displayed.
         *
         * @type {boolean}
         */
        _filmstripVisible: visible,

        /**
         * The current state the recording feature is in.
         *
         * @type {string}
         */
        _recordingState: recordingState,

        /**
         * How recording is being done right now. For example, "jibri" would
         * indicate live streaming.
         *
         * @type {string}
         */
        _recordingType: state['features/base/config'].recordingType,

        /**
         * Whether or not remote videos are displayed in the filmstrip.
         *
         * @type {boolean}
         */
        _remoteVideosVisible: remoteVideosVisible,

        /**
         * Whether or not {@code RecordingLabel} should be visible.
         *
         * @type {boolean}
         */
        _shouldDisplay: displayRecordingLabel
    };
}

export default translate(connect(_mapStateToProps)(RecordingLabel));
