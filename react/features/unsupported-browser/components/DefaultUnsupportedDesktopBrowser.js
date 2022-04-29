/* @flow */

import React, { Component } from 'react';

/**
 * React component representing unsupported browser page.
 *
 * @class DefaultUnsupportedDesktopBrowser
 */
class DefaultUnsupportedDesktopBrowser extends Component {

    /**
     * Redirects to the static recommended browsers page that is also used for IE.
     *
     * @returns {void}
     */
    componentDidMount() {
        window.location.pathname = 'static/recommendedBrowsers.html';
    }

    /**
     * Renders the component.
     *
     * @returns {ReactElement}
     */
    render() {
        return (
            <div />
        );
    }
}

export default DefaultUnsupportedDesktopBrowser;
