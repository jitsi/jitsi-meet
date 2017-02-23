/* @flow */

import React, { Component } from 'react';

import { Platform } from '../../base/react';
import { translate } from '../../base/translation';

import { CHROME, FIREFOX, IE, SAFARI } from './browserLinks';
import HideNotificationBarStyle from './HideNotificationBarStyle';

/**
 * The CSS style namespace of UnsupportedDesktopBrowser.
 *
 * @private
 * @type {string}
 */
const _NS = 'unsupported-desktop-browser';

/**
 * React component representing unsupported browser page.
 *
 * @class UnsupportedDesktopBrowser
 */
class UnsupportedDesktopBrowser extends Component {
    /**
     * UnsupportedDesktopBrowser component's property types.
     *
     * @static
     */
    static propTypes = {
        t: React.PropTypes.func
    }

    /**
     * Renders the component.
     *
     * @returns {ReactElement}
     */
    render() {
        return (
            <div className = { _NS }>
                <h2 className = { `${_NS}__title` }>
                    It looks like you're using a browser we don't support.
                </h2>
                <p className = { `${_NS}__description` }>
                    Please try again with the latest version of&nbsp;
                    <a
                        className = { `${_NS}__link` }
                        href = { CHROME } >Chrome</a>,&nbsp;
                    <a
                        className = { `${_NS}__link` }
                        href = { FIREFOX }>Firefox</a> or&nbsp;
                    {
                        this._renderOSSpecificBrowserDownloadLink()
                    }
                </p>

                <HideNotificationBarStyle />
            </div>
        );
    }

    /**
     * Depending on the platform returns the link to Safari browser.
     *
     * @returns {ReactElement|null}
     * @private
     */
    _renderOSSpecificBrowserDownloadLink() {
        let link;
        let text;

        switch (Platform.OS) {
        case 'macos':
            link = SAFARI;
            text = 'Safari';
            break;

        case 'windows':
            link = IE;
            text = 'Internet Explorer';
            break;
        }
        if (typeof link !== 'undefined') {
            return (
                <a
                    className = { `${_NS}__link` }
                    href = { link }>
                    {
                        text
                    }
                </a>
            );
        }

        return null;
    }
}

export default translate(UnsupportedDesktopBrowser);
