import React, { Component } from 'react';

import JitsiMeetJS from '../../base/lib-jitsi-meet';

/**
 * React component representing unsupported browser page.
 *
 * @class DefaultUnsupportedDesktopBrowser
 */
class DefaultUnsupportedDesktopBrowser extends Component {

    /**
     * Redirects to the static recommended browsers page or the WebRTC unsupported page.
     * IE and other browsers without WebRTC support will show the WebRTC unsupported page.
     *
     * @returns {void}
     */
    override componentDidMount() {
        if (!JitsiMeetJS.isWebRtcSupported()) {
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
