// @flow

import React from 'react';

import { getLocalParticipant } from '../../base/participants';
import { connect } from '../../base/redux';
import { getLargeVideoParticipant } from '../../large-video/functions';
import { isLayoutTileView } from '../../video-layout';

import {
    _abstractMapStateToProps,
    AbstractCaptions,
    type AbstractCaptionsProps
} from './AbstractCaptions';

type Props = {

    /**
     * Whether the subtitles container is lifted above the invite box.
     */
    _isLifted: boolean
} & AbstractCaptionsProps;

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

        const className = this.props._isLifted ? 'transcription-subtitles lifted' : 'transcription-subtitles';

        return (
            <div className = { className } >
                { paragraphs }
            </div>
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code }'s
 * props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Object}
 */
function mapStateToProps(state) {
    const isTileView = isLayoutTileView(state);
    const largeVideoParticipant = getLargeVideoParticipant(state);
    const localParticipant = getLocalParticipant(state);

    return {
        ..._abstractMapStateToProps(state),
        _isLifted: largeVideoParticipant && largeVideoParticipant?.id !== localParticipant?.id && !isTileView
    };
}

export default connect(mapStateToProps)(Captions);
