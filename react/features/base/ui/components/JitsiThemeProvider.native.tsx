import * as React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';

import BaseTheme from './BaseTheme.native';

interface IProps {

    /**
    * The children of the component.
    */
    children: React.ReactNode;
}

/**
 * The theme provider for the mobile app.
 *
 * @param {Object} props - The props of the component.
 * @returns {React.ReactNode}
 */
export default function JitsiThemePaperProvider(props: IProps) {
    return <PaperProvider theme = { BaseTheme }>{ props.children }</PaperProvider>;
}
