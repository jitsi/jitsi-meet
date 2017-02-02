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

        return (
            <div className = { ns }>
                <h2 className = { `${ns}__title` }>
                    Your browser requires a plugin for this conversation.
                </h2>
                <p className = { `${ns}__description_small` }>
                    Once you install the plugin, it will be possible for you
                    to have your conversation here. For best experience,
                    however, we strongly recommend that you do that using
                    the&nbsp;
                    <a
                        className = { `${ns}__link` }
                        href = { CHROME }>Chrome</a>,&nbsp;
                    <a
                        className = { `${ns}__link` }
                        href = { CHROMIUM }>Chromium</a> or&nbsp;
                    <a
                        className = { `${ns}__link` }
                        href = { FIREFOX }>Firefox</a> browsers.
                </p>
            </div>
        );
    }
}

