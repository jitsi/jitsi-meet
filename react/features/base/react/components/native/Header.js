// @flow

import React, { PureComponent, type Node } from 'react';
import { SafeAreaView, StatusBar, View } from 'react-native';

import { ColorSchemeRegistry } from '../../../color-scheme';
import { connect } from '../../../redux';
import { isDarkColor } from '../../../styles';

// Register style
import './headerstyles';

/**
 * Constanst for the (currently) supported statusbar colors.
 */
const STATUSBAR_DARK = 'dark-content';
const STATUSBAR_LIGHT = 'light-content';

/**
 * The type of the React {@code Component} props of {@link Header}
 */
type Props = {

    /**
     * Children component(s).
     */
    children: Node,

    /**
     * The component's external style
     */
    style: Object,

    /**
     * The color schemed style of the component.
     */
    _styles: Object
}

/**
 * A generic screen header component.
 */
class Header extends PureComponent<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { _styles } = this.props;

        return (
            <View style = { _styles.headerOverlay }>
                <StatusBar
                    backgroundColor = { _styles.statusBar }
                    barStyle = { this._getStatusBarContentColor() }
                    translucent = { false } />
                <SafeAreaView>
                    <View
                        style = { [
                            _styles.screenHeader,
                            this.props.style
                        ] }>
                        {
                            this.props.children
                        }
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    /**
     * Calculates the color of the statusbar content (light or dark) based on
     * certain criteria.
     *
     * @returns {string}
     */
    _getStatusBarContentColor() {
        const { _styles } = this.props;
        const { statusBarContent } = _styles;

        if (statusBarContent) {
            // We have the possibility to define the statusbar color in the
            // color scheme feature, but since mobile devices (at the moment)
            // only support two colors (light and dark) we need to normalize
            // the value.

            if (isDarkColor(statusBarContent)) {
                return STATUSBAR_DARK;
            }

            return STATUSBAR_LIGHT;
        }

        // The statusbar color is not defined, so we need to base our choice
        // on the header colors
        const { statusBar, screenHeader } = _styles;

        if (isDarkColor(statusBar || screenHeader.backgroundColor)) {
            return STATUSBAR_LIGHT;
        }

        return STATUSBAR_DARK;
    }
}

/**
 * Maps part of the Redux state to the props of the component.
 *
 * @param {Object} state - The Redux state.
 * @returns {{
 *     _styles: Object
 * }}
 */
function _mapStateToProps(state) {
    return {
        _styles: ColorSchemeRegistry.get(state, 'Header')
    };
}

export default connect(_mapStateToProps)(Header);
