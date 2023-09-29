import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import * as React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';

import BaseTheme from './BaseTheme.web';

interface IProps {

    /**
     * The default theme or theme set through advanced branding.
     */
    _theme: Object;

    /**
    * The children of the component.
    */
    children: React.ReactNode;
}

/**
 * The theme provider for the web app.
 *
 * @param {Object} props - The props of the component.
 * @returns {React.ReactNode}
 */
function JitsiThemeProvider(props: IProps) {
    return (
        <StyledEngineProvider injectFirst = { true }>
            <ThemeProvider theme = { props._theme }>{ props.children }</ThemeProvider>
        </StyledEngineProvider>
    );
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { muiBrandedTheme } = state['features/dynamic-branding'];

    return {
        _theme: muiBrandedTheme || BaseTheme
    };
}

export default connect(_mapStateToProps)(JitsiThemeProvider);
