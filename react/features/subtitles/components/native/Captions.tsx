import React, { ReactElement } from 'react';
import { GestureResponderEvent, StyleProp } from 'react-native';
import { connect } from 'react-redux';

import Container from '../../../base/react/components/native/Container';
import Text from '../../../base/react/components/native/Text';
import {
    AbstractCaptions,
    type IAbstractCaptionsProps,
    _abstractMapStateToProps
} from '../AbstractCaptions';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link Captions}.
 */
interface IProps extends IAbstractCaptionsProps {
    onPress: (event: GestureResponderEvent) => void;
}

/**
 * React {@code Component} which can display speech-to-text results from
 * Jigasi as subtitles.
 */
class Captions extends AbstractCaptions<IProps> {
    /**
     * Renders the transcription text.
     *
     * @param {string} id - The ID of the transcript message from which the
     * {@code text} has been created.
     * @param {string} text - Subtitles text formatted with the participant's
     * name.
     * @protected
     * @returns {ReactElement} - The React element which displays the text.
     */
    _renderParagraph(id: string, text: string): ReactElement {
        return (
            <Text
                key = { id }
                onPress = { this.props.onPress }
                style = { styles.captionsSubtitles as StyleProp<Object> } >
                { text }
            </Text>
        );
    }

    /**
     * Renders the subtitles container.
     *
     * @param {Array<ReactElement>} paragraphs - An array of elements created
     * for each subtitle using the {@link _renderParagraph} method.
     * @protected
     * @returns {ReactElement} - The subtitles container.
     */
    _renderSubtitlesContainer(paragraphs: Array<ReactElement>): ReactElement {
        return (
            <Container style = { styles.captionsSubtitlesContainer } >
                { paragraphs }
            </Container>
        );
    }
}

export default connect(_abstractMapStateToProps)(Captions);
