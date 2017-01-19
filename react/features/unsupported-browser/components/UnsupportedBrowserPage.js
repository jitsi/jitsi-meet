import React, { Component } from 'react';

/**
 * Array of all supported browsers.
 */
const SUPPORTED_BROWSERS = [
    {
        link: 'http://google.com/chrome',
        name: 'chrome',
        plugin: false,
        title: 'Chrome 44+'
    }, {
        link: 'http://www.chromium.org/',
        name: 'chromium',
        plugin: false,
        title: 'Chromium 44+'
    }, {
        link: 'http://www.opera.com',
        name: 'opera',
        plugin: false,
        title: 'Opera 32+'
    }, {
        link: 'http://www.getfirefox.com/',
        name: 'firefox',
        plugin: false,
        title: 'Firefox and Iceweasel 40+'
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
 * @class UnsupportedBrowserPage
 */
export default class UnsupportedBrowserPage extends Component {
    /**
     * Renders the component.
     *
     * @returns {ReactElement}
     */
    render() {
        return (
            <div className = 'unsupported-browser-wrapper'>
                <div className = 'unsupported-browser'>
                    <div className = 'unsupported-browser__content'>
                        <h2 className = 'unsupported-browser__title'>
                            This application is currently only supported by
                        </h2>
                        { this._getSupportedBrowsersLayout() }
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Generates layout for the list of supported browsers.
     *
     * @returns {ReactElement}
     * @private
     */
    _getSupportedBrowsersLayout() {
        return (
            <div className = 'browser-list'>
                { SUPPORTED_BROWSERS.map(this._getSupportedBrowser) }
            </div>
        );
    }

    /**
     * Method that generated layout for supported browser object.
     *
     * @param {Object} browser - Object containing information about supported
     * browser.
     * @returns {ReactElement}
     * @private
     */
    _getSupportedBrowser(browser) {
        let pluginHtml = null;
        const logoClassName = `browser__logo browser__logo_${browser.name}`;

        // Browsers not supporting WebRTC could support application
        // with Temasys plugin installed.
        if (browser.plugin) {
            const className = 'browser__text_small';

            pluginHtml = <p className = { className }>({ browser.plugin })</p>;
        }

        return (
            <div className = 'browser'>
                <div className = 'browser__text'>
                    { browser.title }
                    { pluginHtml }
                </div>
                <div className = 'browser__tile'>
                    <div className = { logoClassName } />
                    <a
                        className = 'browser__link'
                        href = { browser.link }>
                        <div className = 'browser__button'>DOWNLOAD</div>
                    </a>
                </div>
            </div>
        );
    }
}
