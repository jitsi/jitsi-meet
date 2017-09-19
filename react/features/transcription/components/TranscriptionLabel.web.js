import JitsiMeetJS from '../../base/lib-jitsi-meet';

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { shouldRemoteVideosBeVisible } from '../../filmstrip';

/**
 * React {@code Component} responsible for displaying a label that indicates
 * the transcription current state.
 */
export class TranscriptionLabel extends Component {
    /**
     * {@code VideoQualityLabel}'s property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not the filmstrip is currently set to be displayed.
         */
        _filmstripVisible: React.PropTypes.bool,

        /**
         * Whether or not remote videos within the filmstrip are currently
         * visible. Depending on the visibility state, coupled with filmstrip
         * visibility, CSS classes will be set to allow for adjusting of
         * {@code TranscriptionLabel} positioning.
         */
        _remoteVideosVisible: React.PropTypes.bool,

        /**
         * The current state of the transcription.
         */
        _transcriptionState: React.PropTypes.string
    };

    /**
     * Initializes a new {@code TranscriptionLabel} instance.
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
        const isVisible = this.props._transcriptionState
            === JitsiMeetJS.constants.transcriptionStatus.ON;

        const rootClassName = [
            'video-state-indicator moveToCorner',
            isVisible ? 'show-inline' : '',
            this.state.filmstripBecomingVisible ? 'opening' : '',
            this.props._filmstripVisible
                ? 'with-filmstrip' : 'without-filmstrip',
            this.props._remoteVideosVisible
                ? 'with-remote-videos' : 'without-remote-videos'
        ].join(' ');

        return (
            isVisible
                ? <span
                    className = { rootClassName }
                    id = 'transcriptionLabel'>
                    <span className = 'icon-edit' />
                </span>
                : null
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code TranscriptionLabel}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _filmstripVisible: boolean,
 *     _remoteVideosVisible: boolean,
 *     _transcriptionState: string
 * }}
 */
function _mapStateToProps(state) {
    const { visible } = state['features/filmstrip'];
    const { transcriptionState } = state['features/transcription'];

    return {
        /**
         * Whether or not the filmstrip is currently set to be displayed.
         *
         * @type {boolean}
         */
        _filmstripVisible: visible,

        /**
         * Whether or not remote videos are displayed in the filmstrip.
         *
         * @type {boolean}
         */
        _remoteVideosVisible: shouldRemoteVideosBeVisible(state),

        /**
         * The current state of the transcription.
         */
        _transcriptionState: transcriptionState
    };
}

export default connect(_mapStateToProps)(TranscriptionLabel);
