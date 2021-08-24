// @flow

import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { isVideoMutedByUser } from '../../base/media';
import { PreMeetingScreen } from '../../base/premeeting';
import { connect } from '../../base/redux';
import { getLocalJitsiVideoTrack } from '../../base/tracks';
import { isDeviceStatusVisible } from '../functions';

type Props = {

    /**
     * Indicates the className that needs to be applied.
    */
     className: string,

    /**
     * Flag signaling if the device status is visible or not.
     */
    deviceStatusVisible: boolean,

    /**
     * Flag signaling the visibility of camera preview.
     */
    showCameraPreview: boolean,

    /**
     * Used for translation.
     */
    t: Function,

    /**
     * The JitsiLocalTrack to display.
     */
    videoTrack: ?Object
};


/**
 * This component is displayed before joining a meeting.
 */
class PrejoinThirdParty extends Component<Props> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            className,
            deviceStatusVisible,
            showCameraPreview,
            videoTrack
        } = this.props;

        return (
            <PreMeetingScreen
                className = { `prejoin-third-party ${className}` }
                showDeviceStatus = { deviceStatusVisible }
                skipPrejoinButton = { false }
                thirdParty = { true }
                videoMuted = { !showCameraPreview }
                videoTrack = { videoTrack } />
        );
    }
}

/**
 * Maps (parts of) the redux state to the React {@code Component} props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The props passed to the component.
 * @returns {Object}
 */
function mapStateToProps(state): Object {
    return {
        deviceStatusVisible: isDeviceStatusVisible(state),
        showCameraPreview: !isVideoMutedByUser(state),
        videoTrack: getLocalJitsiVideoTrack(state)
    };
}

export default connect(mapStateToProps)(translate(PrejoinThirdParty));
