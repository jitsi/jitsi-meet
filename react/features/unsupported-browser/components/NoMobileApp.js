/* @flow */

import React, { Component } from 'react';

declare var interfaceConfig: Object;

/**
 * React component representing no mobile app page.
 *
 * @class NoMobileApp
 */
export default class NoMobileApp extends Component {

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
                    Video chat isn't available in the mobile apps
                </h2>
                <p className = { `${ns}__description` }>
                    Video chat isn't available on mobile
                    Desktop to join calls.
                </p>
            </div>
        );
    }
}
