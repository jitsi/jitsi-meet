// @flow

import React from 'react';
import WebView from 'react-native-webview';

import JitsiScreen from './JitsiScreen';

type Props = {

    /**
     * The URL to display.
     */
    source: string,

    /**
     * The component's external style.
     */
    style: Object
}

const JitsiScreenWebView = ({ source, style }: Props) => (
    <JitsiScreen
        style = { style }>
        <WebView source = {{ uri: source }} />
    </JitsiScreen>
);

export default JitsiScreenWebView;
