/* @flow */

import React, { Component } from 'react';

import { Platform } from '../../base/react';

import { CHROME, FIREFOX, IE, SAFARI } from './browserLinks';
import HideNotificationBarStyle from './HideNotificationBarStyle';

/**
 * Describes styles namespace for this component.
 *
 * @type {string}
 */
const NS = 'unsupported-desktop-browser';

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
        return (
            <div className = { NS }>
                <h2 className = { `${NS}__title` }>
                    It looks like you're using a browser we don't support.
                </h2>
                <p className = { `${NS}__description` }>
                    Please try again with the latest version of&nbsp;
                    <a
                        className = { `${NS}__link` }
                        href = { CHROME } >Chrome</a>,&nbsp;
                    <a
                        className = { `${NS}__link` }
                        href = { FIREFOX }>Firefox</a> or&nbsp;
                    { this._showSafariLinkIfRequired() }
                    { this._showIELinkIfRequired() }.
                </p>

                <HideNotificationBarStyle />
            </div>
        );
    }

    /**
     * Depending on the platform returns the link to IE browser.
     *
     * @returns {ReactElement|null}
     * @private
     */
    _showIELinkIfRequired() {
        if (Platform.OS === 'windows') {
            return (
                <a
                    className = { `${NS}__link` }
                    href = { IE }>IE</a>
            );
        }

        return null;
    }

    /**
     * Depending on the platform returns the link to Safari browser.
     *
     * @returns {ReactElement|null}
     * @private
     */
    _showSafariLinkIfRequired() {
        if (Platform.OS === 'mac') {
            return (
                <a
                    className = { `${NS}__link` }
                    href = { SAFARI }>Safari</a>
            );
        }

        return null;
    }
}

