import React, { Component } from 'react';

import { isWebRTCAvailable } from '../../base/environment/webrtc.support';

/**
 * React component representing unsupported browser page.
 *
 * @class DefaultUnsupportedDesktopBrowser
 */
class DefaultUnsupportedDesktopBrowser extends Component {

    /**
     * Redirects to the static recommended browsers page that is also used for IE,
     * or if WebRTC is missing, shows WebRTC-specific guidance.
     *
     * @returns {void}
     */
    override componentDidMount() {
        if (!isWebRTCAvailable()) {
            window.location.pathname = 'static/webrtcUnsupported.html';
        } else {
            window.location.pathname = 'static/recommendedBrowsers.html';
        }
    }

    /**
     * Renders the component.
     *
     * @returns {ReactElement}
     */
    override render() {
        return (
            <div />
        );
    }
}

export default DefaultUnsupportedDesktopBrowser;
