import React from 'react';

/**
 * Returns the updated list of transcription paragraphs to be rendered after
 * update or delete on timeout.
 *
 * @param {Map} transcriptMessages - The map containing the list of
 * (transcriptMessageID, transcriptMessage) as (key, value) pairs.
 * @returns {Array} The array of React paragraph elements to be rendered.
 */
export function getUpdatedTranscriptionParagraphs(transcriptMessages) {
    const paragraphs = [];

    for (const [ transcriptMessageID, transcriptMessage ]
        of transcriptMessages) {
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

    return paragraphs;
}
