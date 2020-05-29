/* @flow */

import React, { Component } from 'react';

import { isBrowsersOptimal, isBraveBrowser } from '../../base/environment';
import { isMobileBrowser } from '../../base/environment/utils';
import { translate } from '../../base/i18n';

import { BRAVE_DOWNLOAD, BRAVE_SITE } from './browserLinks';

/**
 * The namespace of the CSS styles of UnsupportedDesktopBrowser.
 *
 * @private
 * @type {string}
 */
const _SNS = 'unsupported-desktop-browser';

/**
 * The type of the React {@code Component} props of
 * {@link UnsupportedDesktopBrowser}.
 */
type Props = {

    /**
     * The function to translate human-readable text.
     */
    t: Function
};

/**
 * React component representing unsupported browser page.
 *
 * @class UnsupportedDesktopBrowser
 */
class UnsupportedDesktopBrowser extends Component<Props> {
    /**
     * Renders the component.
     *
     * @returns {ReactElement}
     */
    render() {
        if (isBraveBrowser() && isMobileBrowser()) {
            // temporary...
            return (
                <div className = { _SNS }>
                    <h2 className = { `${_SNS}__title` }>
                        Sorry! At present, mobile browsers are not supported.
                    </h2>
                </div>
            );
        }

        return (
            <div className = { _SNS }>
                <h2 className = { `${_SNS}__title` }>
                    <a href = { BRAVE_DOWNLOAD } >Download Brave</a> to join this call.
                </h2>
                <p className = { `${_SNS}__description` }>
                    <a
                        className = { `${_SNS}__link` }
                        href = { BRAVE_SITE } >Learn more.</a>&nbsp;
                </p>
            </div>
        );
    }

    /**
     * Returns whether or not a link to download Firefox is displayed.
     *
     * @private
     * @returns {boolean}
     */
    _showFirefox() {
        return isBrowsersOptimal('firefox');
    }
}

export default translate(UnsupportedDesktopBrowser);
