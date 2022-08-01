import { ThemeProvider } from '@material-ui/core/styles';
import * as React from 'react';
import { connect } from 'react-redux';

import BaseTheme from './BaseTheme.web';

type Props = {

    /**
     * The default theme or theme set through advanced branding.
     */
    _theme: Object,

    /**
    * The children of the component.
    */
    children: React.ReactNode
}

/**
 * The theme provider for the web app.
 *
 * @param {Object} props - The props of the component.
 * @returns {React.ReactNode}
 */
function JitsiThemeProvider(props: Props) {
    return <ThemeProvider theme = { props._theme }>{ props.children }</ThemeProvider>;
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state: any) {
    const { muiBrandedTheme } = state['features/dynamic-branding'];

    return {
        _theme: muiBrandedTheme || BaseTheme
    };
}

export default connect(_mapStateToProps)(JitsiThemeProvider);
