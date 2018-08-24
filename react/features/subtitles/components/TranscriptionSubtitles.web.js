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
    _transcriptMessages: Map<string, Object>,

    /**
     * Whether local participant is requesting to see subtitles
     */
    _requestingSubtitles: Boolean
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
        if (!this.props._requestingSubtitles
             || !this.props._transcriptMessages) {
            return null;
        }

        const paragraphs = [];

        for (const [ transcriptMessageID, transcriptMessage ]
            of this.props._transcriptMessages) {
            let text;

            if (transcriptMessage) {
                text = `${transcriptMessage.participantName}: `;

                if (transcriptMessage.final) {
                    text += transcriptMessage.final;
                } else {
                    const stable = transcriptMessage.stable || '';
                    const unstable = transcriptMessage.unstable || '';

                    text += stable + unstable;
                }
                paragraphs.push(
                    <p key = { transcriptMessageID }>
                        <span>{ text }</span>
                    </p>
                );
            }
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
 *     _transcriptMessages: Map
 * }}
 */
function _mapStateToProps(state) {
    const {
        _transcriptMessages,
        _requestingSubtitles
    } = state['features/subtitles'];

    return {
        _transcriptMessages,
        _requestingSubtitles
    };
}
export default connect(_mapStateToProps)(TranscriptionSubtitles);
