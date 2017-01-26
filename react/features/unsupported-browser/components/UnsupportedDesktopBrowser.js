import React, { Component } from 'react';

/**
 * The list of all browsers supported by the application.
 */
const SUPPORTED_BROWSERS = [
    {
        link: 'http://google.com/chrome',
        name: 'chrome',
        title: 'Chrome 44+'
    }, {
        link: 'http://www.chromium.org/',
        name: 'chromium',
        title: 'Chromium 44+'
    }, {
        link: 'http://www.getfirefox.com/',
        name: 'firefox',
        title: 'Firefox and Iceweasel 40+'
    }, {
        link: 'http://www.opera.com',
        name: 'opera',
        title: 'Opera 32+'
    }, {
        link: 'https://temasys.atlassian.net/wiki/display/TWPP/WebRTC+Plugins',
        name: 'ie',
        plugin: 'Temasys 0.8.854+',
        title: 'IE'
    }, {
        link: 'https://temasys.atlassian.net/wiki/display/TWPP/WebRTC+Plugins',
        name: 'safari',
        plugin: 'Temasys 0.8.854+',
        title: 'Safari'
    }
];

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
            <div className = { `${ns}-wrapper` }>
                <div className = { ns }>
                    <div className = { `${ns}__content` }>
                        <h2 className = { `${ns}__title` }>
                            This application is currently only supported by
                        </h2>
                        {
                            this._renderSupportedBrowsers()
                        }
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Renders a specific browser supported by the application.
     *
     * @param {Object} browser - The (information about the) browser supported
     * by the application to render.
     * @private
     * @returns {ReactElement}
     */
    _renderSupportedBrowser(browser) {
        const { link, name, plugin, title } = browser;
        const ns = 'supported-browser';

        // Browsers which do not support WebRTC could support the application
        // with the Temasys plugin.
        const pluginElement
            = plugin
                ? <p className = { `${ns}__text_small` }>{ plugin }</p>
                : null;

        return (
            <div
                className = { ns }
                key = { name }>
                <div className = { `${ns}__text` }>
                    {
                        title
                    }
                    {
                        pluginElement
                    }
                </div>
                <div className = { `${ns}__tile` }>
                    <div
                        className = { `${ns}__logo ${ns}__logo_${name}` } />
                    <a
                        className = { `${ns}__link` }
                        href = { link }>
                        <div className = { `${ns}__button` }>DOWNLOAD</div>
                    </a>
                </div>
            </div>
        );
    }

    /**
     * Renders the list of browsers supported by the application.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderSupportedBrowsers() {
        return (
            <div className = 'supported-browser-list'>
                {
                    SUPPORTED_BROWSERS.map(this._renderSupportedBrowser)
                }
            </div>
        );
    }
}
