/* @flow */

import React, { Component } from 'react';

/**
 * React component that represents HTML style element with CSS specific to
 * unsupported mobile browser components.
 *
 * @private
 * @returns {ReactElement}
 */
export default class HideNotificationBarStyles extends Component<*> {

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        // Temasys provide lib-jitsi-meet/modules/RTC/adapter.screenshare.js
        // which detects whether the browser supports WebRTC. If the browser
        // does not support WebRTC, it displays an alert in the form of a yellow
        // bar at the top of the page. The alert notifies the user that the
        // browser does not support WebRTC and, if Temasys provide a plugin for
        // the browser, the alert contains a button to initiate installing the
        // browser. When Temasys do not provide a plugin for the browser, we do
        // not want the alert on the unsupported-browser page because the
        // notification about the lack of WebRTC support is the whole point of
        // the unsupported-browser page.
        return (
            <style type = 'text/css'>
                {
                    'iframe[name="adapterjs-alert"] { display: none; }'
                }
            </style>
        );
    }
}
