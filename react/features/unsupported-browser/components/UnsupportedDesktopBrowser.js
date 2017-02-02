import React, { Component } from 'react';

import { CHROME, FIREFOX, IE, SAFARI } from './browserLinks';

/**
 * React component representing unsupported browser page.
 *
 * @class UnsupportedDesktopBrowser
 */
export default class UnsupportedDesktopBrowser extends Component {

    /**
     * Renders the component.
     *
     * @returns {ReactElement}
     */
    render() {
        const ns = 'unsupported-desktop-browser';

        return (
            <div className = { ns }>
                <h2 className = { `${ns}__title` }>
                    It looks like you're using a browser we don't support.
                </h2>
                <p className = { `${ns}__description` }>
                    Please try again with&nbsp;
                    <a
                        className = { `${ns}__link` }
                        href = { CHROME } >Chrome</a>,&nbsp;
                    <a
                        className = { `${ns}__link` }
                        href = { FIREFOX }>Firefox</a>,&nbsp;
                    <a
                        className = { `${ns}__link` }
                        href = { SAFARI }>Safari</a> or&nbsp;
                    <a
                        className = { `${ns}__link` }
                        href = { IE }>IE</a>.
                </p>
            </div>
        );
    }
}

