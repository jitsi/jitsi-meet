import React from 'react';

/**
 * Returns the updated list of transcription paragraphs to be rendered after
 * update or delete on timeout.
 *
 * @param {Object} transcriptMessages - The object of transcription messaged of
 * different message_id's as key.
 * @returns {Array} The array of React paragraph elements to be rendered.
 */
export function getUpdatedTranscriptionParagraphs(transcriptMessages) {
    const paragraphs = [];

    Object.keys(transcriptMessages).forEach(id => {
        const transcriptMessage = transcriptMessages[id];
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

        paragraphs.push(<p key = { id }> { text } </p>);
    });

    return paragraphs;
}
