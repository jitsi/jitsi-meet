// @flow

import { ThemeProvider } from '@material-ui/core/styles';
import * as React from 'react';

import BaseTheme from './BaseTheme';

type Props = {

   /**
    * The children of the component.
    */
    children: React.ChildrenArray<any>
}

/**
 * The theme provider for the web app.
 *
 * @param {Object} props - The props of the component.
 * @returns {React.ReactNode}
 */
export default function JitsiThemeProvider(props: Props) {
    return <ThemeProvider theme = { BaseTheme }>{ props.children }</ThemeProvider>;
}
