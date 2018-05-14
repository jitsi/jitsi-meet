// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { RecordingLabel } from '../../recording';
import { VideoQualityLabel } from '../../video-quality';

/**
 * The type of the React {@code Component} props of {@link Labels}.
 */
type Props = {

    /**
    * Whether or not the filmstrip is displayed with remote videos. Used to
    * determine display classes to set.
    */
    _filmstripVisible: boolean,


    /**
     * The redux state for all known recording sessions.
     */
    _recordingSessions: Array<Object>
};

/**
 * The type of the React {@code Component} state of {@link Labels}.
 */
type State = {

    /**
     * Whether or not the filmstrip was not visible but has transitioned in the
     * latest component update to visible. This boolean is used  to set a class
     * for position animations.
     *
     * @type {boolean}
     */
    filmstripBecomingVisible: boolean
}

/**
 * A container to hold video status labels, including recording status and
 * current large video quality.
 *
 * @extends Component
 */
class Labels extends Component<Props, State> {
    /**
     * Initializes a new {@code Labels} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        this.state = {
            filmstripBecomingVisible: false
        };

        // Bind event handler so it is only bound once for every instance.
        this._renderRecordingLabel = this._renderRecordingLabel.bind(this);
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
        const { _filmstripVisible, _recordingSessions } = this.props;
        const { filmstripBecomingVisible } = this.state;
        const className = `large-video-labels ${
            filmstripBecomingVisible ? 'opening' : ''} ${
            _filmstripVisible ? 'with-filmstrip' : 'without-filmstrip'}`;

        return (
            <div className = { className } >
                { _recordingSessions.map(this._renderRecordingLabel) }
                <VideoQualityLabel />
            </div>
        );
    }

    _renderRecordingLabel: (Object) => React$Node;

    /**
     * Renders a recording label.
     *
     * @param {Object} recordingSession - The recording session to render.
     * @private
     * @returns {ReactElement}
     */
    _renderRecordingLabel(recordingSession) {
        return (
            <RecordingLabel
                key = { recordingSession.id }
                session = { recordingSession } />
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code Labels} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _filmstripVisible: boolean,
 *     _recordingSessions: Array<Object>
 * }}
 */
function _mapStateToProps(state) {
    return {
        _filmstripVisible: state['features/filmstrip'].visible,
        _recordingSessions: state['features/recording'].sessionDatas
    };
}

export default connect(_mapStateToProps)(Labels);
