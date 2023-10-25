// @flow
import { ErrorBoundary as SentryErrorBoundary } from '@sentry/react';
import React from 'react';

import { initSentry } from '../../../../sentry';

type Props = {

    /**
     * The React {@code Component} children which represents the app.
     */
    children: React$Node | null,
};

window.hasSentryInitialized = initSentry();

export const ErrorBoundary = (props: Props) => {
    const { children } = props;

    if (navigator.product === 'ReactNative' || !window.hasSentryInitialized) {
        return children;
    }

    return <SentryErrorBoundary fallback = { <p>An error has occurred</p> }>{children}</SentryErrorBoundary>;
};
