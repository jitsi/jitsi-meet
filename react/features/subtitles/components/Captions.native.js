// @flow

import React from 'react';

import { Container, Text } from '../../base/react';
import { connect } from '../../base/redux';

import {
    _abstractMapStateToProps,
    AbstractCaptions,
    type AbstractCaptionsProps
} from './AbstractCaptions';
import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link Captions}.
 */
type Props = AbstractCaptionsProps & {
    onPress: Function
};

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
            <Text
                key = { id }
                onPress = { this.props.onPress }
                style = { styles.subtitle } >
                { text }
            </Text>
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
            <Container style = { styles.subtitlesContainer } >
                { paragraphs }
            </Container>
        );
    }
}

export default connect(_abstractMapStateToProps)(Captions);
