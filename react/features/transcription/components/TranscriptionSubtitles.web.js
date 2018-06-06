// @flow

import React, { Component } from 'react';
import { connect } from 'react-redux';

/**
 * The type of the React {@code Component} props of
 * {@link TranscriptionSubtitles}.
 */
type Props = {

    /**
     * Map of transcriptMessageID's with corresponding transcriptMessage.
     */
    transcriptMessages: Map<string, Object>
};

/**
 * React {@code Component} which can display speech-to-text results from
 * Jigasi as subtitles.
 */
class TranscriptionSubtitles extends Component<Props> {

    /**
     * Updates the transcription subtitles only if the Map of transcriptMessages
     * change otherwise prevents the unnecessary re-render..
     *
     * @inheritdoc
     * @param { Object } nextProps - The props passed to the component before
     * rendering the component.
     * @returns {boolean} - True if props of the component changes, else false.
     */
    shouldComponentUpdate(nextProps) {

        return this.props.transcriptMessages !== nextProps.transcriptMessages;
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const paragraphs = [];

        for (const [ transcriptMessageID, transcriptMessage ]
            of this.props.transcriptMessages) {
            let text;

            if (transcriptMessage) {
                text = `${transcriptMessage.participantName}: `;

                if (transcriptMessage.final) {
                    text += transcriptMessage.final;
                } else {
                    const stable = transcriptMessage.stable
                        ? transcriptMessage.stable : '';
                    const unstable = transcriptMessage.unstable
                        ? transcriptMessage.unstable : '';

                    text += stable + unstable;
                }
            }
            paragraphs.push(<p key = { transcriptMessageID }> { text } </p>);
        }

        return (
            <div className = 'transcription-subtitles' >
                { paragraphs }
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
 *     transcriptMessages: Map
 * }}
 */
function _mapStateToProps(state) {
    return {
        transcriptMessages: state['features/transcription'].transcriptMessages
    };
}
export default connect(_mapStateToProps)(TranscriptionSubtitles);
