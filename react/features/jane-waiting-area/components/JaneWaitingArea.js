// @flow
/* eslint-disable require-jsdoc*/

import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { Watermarks } from '../../base/react/components/web';
import { connect } from '../../base/redux';
import JaneHangupButton from '../../toolbox/components/JaneHangupButton';
import AudioSettingsButton from '../../toolbox/components/web/AudioSettingsButton';
import VideoSettingsButton from '../../toolbox/components/web/VideoSettingsButton';
import {
    isDeviceStatusVisible,
    getJaneWaitingAreaPageDisplayName
} from '../functions';

import SocketConnection from './SocketConnection.web';
import Modal from './modal/Modal';
import DeviceStatus from './preview/DeviceStatus';
import Preview from './preview/Preview';

type Props = {
    t: Function,
    deviceStatusVisible: boolean,
    name: string,
    isMobile: boolean,
    connection: Object
};

class JaneWaitingArea extends Component<Props> {

    render() {
        const {
            name,
            deviceStatusVisible,
            isMobile,
            connection
        } = this.props;


        return (
            <div className = 'jane-waiting-area-full-page'>
                {
                    isMobile && <Watermarks />
                }
                <Preview name = { name } />
                {
                    connection && <Modal isMobile = { isMobile } />
                }
                <div className = 'jane-waiting-area-preview-btn-container settings-button-container'>
                    <AudioSettingsButton visible = { true } />
                    <JaneHangupButton visible = { true } />
                    <VideoSettingsButton visible = { true } />
                </div>
                {deviceStatusVisible && <DeviceStatus />}
                {
                    connection && <SocketConnection />
                }
            </div>
        );
    }
}

function mapStateToProps(state): Object {
    const { clientWidth } = state['features/base/responsive-ui'];

    return {
        deviceStatusVisible: isDeviceStatusVisible(state),
        name: getJaneWaitingAreaPageDisplayName(state),
        isMobile: clientWidth <= 768,
        connection: state['features/jane-waiting-area']?.connection
    };
}

export default connect(mapStateToProps)(translate(JaneWaitingArea));
