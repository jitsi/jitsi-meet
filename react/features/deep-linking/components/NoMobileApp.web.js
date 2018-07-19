/* @flow */

import React, { Component } from 'react';

import { createDeepLinkingPageEvent, sendAnalytics } from '../../analytics';

declare var interfaceConfig: Object;

/**
 * React component representing no mobile app page.
 *
 * @class NoMobileApp
 */
export default class NoMobileApp extends Component<*> {
    /**
     * Implements the Component's componentDidMount method.
     *
     * @inheritdoc
     */
    componentDidMount() {
        sendAnalytics(
            createDeepLinkingPageEvent(
                'displayed', 'noMobileApp', { isMobileBrowser: true }));
    }

    /**
     * Renders the component.
     *
     * @returns {ReactElement}
     */
    render() {
        const ns = 'no-mobile-app';

        return (
            <div className = { ns }>
                <h2 className = { `${ns}__title` }>
                    Video chat isn't available on mobile.
                </h2>
                <p className = { `${ns}__description` }>
                    Please use { interfaceConfig.NATIVE_APP_NAME } on desktop to
                    join calls.
                </p>
            </div>
        );
    }
}
