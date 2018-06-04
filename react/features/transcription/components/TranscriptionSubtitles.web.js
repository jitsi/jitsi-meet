// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

/**
 * The type of the React {@code Component} props of
 * {@link TranscriptionSubtitles}.
 */
type Props = {

    /**
     * Array of transcription paragraphs to be displayed as subtitles.
     */
    transcriptionSubtitles: Array<React$Node>
};

/**
 * React {@code Component} which can display speech-to-text results from
 * Jigasi as subtitles.
 */
class TranscriptionSubtitles extends Component<Props> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {

        return (
            <div className = 'transcription-subtitles' >
                { this.props.transcriptionSubtitles }
            </div>
        );
    }
}

/**
 * Maps the transcriptionSubtitles in the Redux state to the associated
 * props of {@code TranscriptionSubtitles}.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     transcriptionSubtitles: string
 * }}
 */
function _mapStateToProps(state) {
    return {
        transcriptionSubtitles:
        state['features/transcription'].transcriptionSubtitles
    };
}
export default connect(_mapStateToProps)(TranscriptionSubtitles);
