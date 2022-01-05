// @flow

import React, { Component } from 'react';
import { Text, View } from 'react-native';

import { ColorSchemeRegistry } from '../../../color-scheme';
import { translate } from '../../../i18n';
import { connect } from '../../../redux';

/**
 * The type of the React {@code Component} props of {@link HeaderLabel}.
 */
type Props = {

    /**
     * The i18n key of the label to be rendered.
     */
    labelKey: string,

    /**
     * The i18n translate function.
     */
    t: Function,

    /**
     * The color schemed style of the Header component.
     */
    _headerStyles: Object
};

/**
 * A component rendering a standard label in the header.
 */
class HeaderLabel extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _headerStyles } = this.props;

        return (
            <View
                pointerEvents = 'box-none'
                style = { _headerStyles.headerTextWrapper }>
                <Text
                    style = { [
                        _headerStyles.headerText
                    ] }>
                    { this.props.t(this.props.labelKey) }
                </Text>
            </View>
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

export default translate(connect(_mapStateToProps)(HeaderLabel));
