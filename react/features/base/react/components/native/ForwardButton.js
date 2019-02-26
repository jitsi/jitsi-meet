// @flow

import React, { Component } from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { translate } from '../../../i18n';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link ForwardButton}
 */
type Props = {

    /**
     * True if the nutton should be disabled.
     */
    disabled: boolean;

    /**
     * The i18n label key of the button.
     */
    labelKey: string,

    /**
     * The action to be performed when the button is pressed.
     */
    onPress: Function,

    /**
     * An external style object passed to the component.
     */
    style?: Object,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * A component rendering a forward/next/action button.
 */
class ForwardButton extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}, renders the button.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <TouchableOpacity
                accessibilityLabel = { 'Forward' }
                disabled = { this.props.disabled }
                onPress = { this.props.onPress } >
                <Text
                    style = { [
                        styles.headerButtonText,
                        this.props.disabled && styles.disabledButtonText,
                        this.props.style
                    ] }>
                    { this.props.t(this.props.labelKey) }
                </Text>
            </TouchableOpacity>
        );
    }
}

export default translate(ForwardButton);
