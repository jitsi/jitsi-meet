// @flow

import React, { Component } from 'react';
import { Text, TouchableOpacity } from 'react-native';

import { ColorSchemeRegistry } from '../../../color-scheme';
import { translate } from '../../../i18n';
import { connect } from '../../../redux';

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
    t: Function,

    /**
     * The color schemed style of the Header component.
     */
    _headerStyles: Object
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
        const { _headerStyles } = this.props;

        return (
            <TouchableOpacity
                accessibilityLabel = { 'Forward' }
                disabled = { this.props.disabled }
                onPress = { this.props.onPress } >
                <Text
                    style = { [
                        _headerStyles.headerButtonText,
                        this.props.disabled && _headerStyles.disabledButtonText,
                        this.props.style
                    ] }>
                    { this.props.t(this.props.labelKey) }
                </Text>
            </TouchableOpacity>
        );
    }
}

/**
 * Maps part of the Redux state to the props of the component.
 *
 * @param {Object} state - The Redux state.
 * @returns {{
 *     _headerStyles: Object
 * }}
 */
function _mapStateToProps(state) {
    return {
        _headerStyles: ColorSchemeRegistry.get(state, 'Header')
    };
}

export default translate(connect(_mapStateToProps)(ForwardButton));
