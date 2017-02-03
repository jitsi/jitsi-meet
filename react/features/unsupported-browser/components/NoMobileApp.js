/* global interfaceConfig */
import React, { Component } from 'react';

/**
 * React component representing no mobile page.
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
                    Please use { interfaceConfig.APP_NAME } on <br />
                    Desktop top join calls.
                </p>
            </div>
        );
    }
}
