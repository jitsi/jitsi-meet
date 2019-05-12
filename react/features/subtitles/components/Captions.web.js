// @flow

import React from 'react';

import { connect } from '../../base/redux';

import {
    _abstractMapStateToProps,
    AbstractCaptions,
    type AbstractCaptionsProps as Props
} from './AbstractCaptions';

/**
 * React {@code Component} which can display speech-to-text results from
 * Jigasi as subtitles.
 */
class Captions
    extends AbstractCaptions<Props> {

    /**
     * Renders the transcription text.
     *
     * @param {string} id - The ID of the transcript message from which the
     * {@code text} has been created.
     * @param {string} text - Subtitles text formatted with the participant's
     * name.
     * @protected
     * @returns {React$Element} - The React element which displays the text.
     */
    _renderParagraph(id: string, text: string): React$Element<*> {
        return (
            <p key = { id }>
                <span>{ text }</span>
            </p>
        );
    }

    /**
     * Renders the subtitles container.
     *
     * @param {Array<React$Element>} paragraphs - An array of elements created
     * for each subtitle using the {@link _renderParagraph} method.
     * @protected
     * @returns {React$Element} - The subtitles container.
     */
    _renderSubtitlesContainer(
            paragraphs: Array<React$Element<*>>): React$Element<*> {
        return (
            <div className = 'transcription-subtitles' >
                { paragraphs }
            </div>
        );
    }
}

export default connect(_abstractMapStateToProps)(Captions);
