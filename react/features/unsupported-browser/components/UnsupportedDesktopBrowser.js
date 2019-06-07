/* @flow */

import React, { Component } from 'react';

import { translate } from '../../base/i18n';

import { CHROME, FIREFOX } from './browserLinks';

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
        return (
            <div className = { _SNS }>
                <h2 className = { `${_SNS}__title` }>
                    It looks like you're using a browser we don't support.
                </h2>
                <p className = { `${_SNS}__description` }>
                    Please try again with the latest version of&nbsp;
                    <a
                        className = { `${_SNS}__link` }
                        href = { CHROME } >Chrome</a> and&nbsp;
                    <a
                        className = { `${_SNS}__link` }
                        href = { FIREFOX }>Firefox</a>
                </p>
            </div>
        );
    }
}

export default translate(UnsupportedDesktopBrowser);
