// @flow
import React from 'react';
import { Text, View } from 'react-native';

import { combineStyles, type StyleType } from '../../styles';

import AbstractCircularLabel, {
    type Props as AbstractProps
} from './AbstractCircularLabel';
import styles from './styles';

type Props = AbstractProps & {

    /**
     * Style of the label.
     */
    style?: ?StyleType
};

/**
 * Renders a circular indicator to be used for status icons, such as recording
 * on, audio-only conference, video quality and similar.
 */
export default class CircularLabel extends AbstractCircularLabel<Props> {
    /**
     * Implements React {@link Component}'s render.
     *
     * @inheritdoc
     */
    render() {
        const { label, style } = this.props;

        return (
            <View
                style = {
                    combineStyles(styles.indicatorContainer, style)
                }>
                <Text style = { styles.indicatorText }>
                    { label }
                </Text>
            </View>
        );
    }
}
