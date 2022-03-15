// @flow

import { jssPreset, StylesProvider, ThemeProvider } from '@material-ui/core/styles';
import { create } from 'jss';
import rtl from 'jss-rtl';
import * as React from 'react';

import { connect } from '../../../base/redux';

import { ltrTheme, rltTheme } from './BaseTheme';

type Props = {

    /**
     * The default theme or theme set through advanced branding.
     */
    _theme: Object,

   /**
    * The children of the component.
    */
    children: React.ChildrenArray<any>
}

// Configure JSS
const jss = create({ plugins: [ ...jssPreset().plugins, rtl() ] });

/**
 * The theme provider for the web app.
 *
 * @param {Object} props - The props of the component.
 * @returns {React.ReactNode}
 */
function JitsiThemeProvider(props: Props) {
    return (<StylesProvider jss = { jss }>
        <ThemeProvider theme = { props._theme }>{ props.children }</ThemeProvider>
    </StylesProvider>);
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { muiBrandedRtlTheme, muiBrandedTheme } = state['features/dynamic-branding'];
    const { direction } = state['features/base/ui'];

    return {
        _theme: direction === 'rtl' ? muiBrandedRtlTheme || rltTheme : muiBrandedTheme || ltrTheme
    };
}

export default connect(_mapStateToProps)(JitsiThemeProvider);
