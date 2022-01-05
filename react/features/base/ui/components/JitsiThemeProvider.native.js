// @flow

import * as React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';

import BaseTheme from './BaseTheme.native';

type Props = {

   /**
    * The children of the component.
    */
    children: React.ChildrenArray<any>
}

/**
 * The theme provider for the mobile app.
 *
 * @param {Object} props - The props of the component.
 * @returns {React.ReactNode}
 */
export default function JitsiThemePaperProvider(props: Props) {
    return <PaperProvider theme = { BaseTheme }>{ props.children }</PaperProvider>;
}
