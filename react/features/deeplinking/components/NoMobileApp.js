/* @flow */

import React, { Component } from 'react';

import { HideNotificationBarStyle } from '../../base/react';

declare var interfaceConfig: Object;

/**
 * React component representing no mobile app page.
 *
 * @class NoMobileApp
 */
export default class NoMobileApp extends Component<*> {
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
                    Please use { interfaceConfig.APP_NAME } on desktop to join
                    calls.
                </p>

                <HideNotificationBarStyle />
            </div>
        );
    }
}
