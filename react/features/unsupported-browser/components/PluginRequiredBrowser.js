/*  @flow */

import React, { Component } from 'react';

import { CHROME, CHROMIUM, FIREFOX } from './browserLinks';

/**
 * React component representing plugin installation required page.
 *
 * @class PluginRequiredBrowser
 */
export default class PluginRequiredBrowser extends Component {

    /**
     * Renders the component.
     *
     * @returns {ReactElement}
     */
    render() {
        const ns = 'unsupported-desktop-browser';
        const nsLink = `${ns}__link`;

        return (
            <div className = { ns }>
                <h2 className = { `${ns}__title` }>
                    Your browser requires a plugin for this conversation.
                </h2>
                <p className = { `${ns}__description_small` }>
                    Once you install the plugin, it will be possible for you to
                    have your conversation here. For the best experience,
                    however, we strongly recommend that you do that using
                    the&nbsp;
                    <a
                        className = { nsLink }
                        href = { CHROME }>Chrome</a>,&nbsp;
                    <a
                        className = { nsLink }
                        href = { CHROMIUM }>Chromium</a> or&nbsp;
                    <a
                        className = { nsLink }
                        href = { FIREFOX }>Firefox</a> browsers.
                </p>
            </div>
        );
    }
}

