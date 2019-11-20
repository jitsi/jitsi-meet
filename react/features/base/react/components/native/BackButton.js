// @flow

import React, { Component } from 'react';
import { TouchableOpacity } from 'react-native';

import { ColorSchemeRegistry } from '../../../color-scheme';
import { Icon, IconArrowBack } from '../../../icons';
import { connect } from '../../../redux';

/**
 * The type of the React {@code Component} props of {@link BackButton}
 */
type Props = {

    /**
     * The action to be performed when the button is pressed.
     */
    onPress: Function,

    /**
     * An external style object passed to the component.
     */
    style?: Object,

    /**
     * The color schemed style of the Header component.
     */
    _headerStyles: Object
};

/**
 * A component rendering a back button.
 */
class BackButton extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}, renders the button.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <TouchableOpacity
                accessibilityLabel = { 'Back' }
                onPress = { this.props.onPress }>
                <Icon
                    src = { IconArrowBack }
                    style = { [
                        this.props._headerStyles.headerButtonIcon,
                        this.props.style
                    ] } />
            </TouchableOpacity>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
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

export default connect(_mapStateToProps)(BackButton);
