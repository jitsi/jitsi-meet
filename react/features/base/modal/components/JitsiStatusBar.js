// @flow

import React, { useCallback } from 'react';
import { StatusBar } from 'react-native';

import { ColorSchemeRegistry } from '../../color-scheme';
import { connect } from '../../redux';
import { isDarkColor } from '../../styles';

// Register style
import '../../react/components/native/headerstyles';

/**
 * Constants for the (currently) supported statusbar colors.
 */
const STATUSBAR_DARK = 'dark-content';
const STATUSBAR_LIGHT = 'light-content';


type Props = {

    /**
     * The color schemed style of the component.
     */
    _styles: Object
}

const JitsiStatusBar = ({ _styles }: Props) => {

    const getStatusBarContentColor = useCallback(() => {
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
    }, [ _styles ]);

    return (
        <StatusBar
            backgroundColor = { _styles.statusBar }
            barStyle = { getStatusBarContentColor() }
            translucent = { false } />
    );
};

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

export default connect(_mapStateToProps)(JitsiStatusBar);
