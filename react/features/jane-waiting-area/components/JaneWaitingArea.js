// @flow
/* eslint-disable require-jsdoc*/

import React, { Component } from 'react';

import { translate } from '../../base/i18n';
import { Watermarks } from '../../base/react/components/web';
import { connect } from '../../base/redux';
import {
    isDeviceStatusVisible,
    getJaneWaitingAreaPageDisplayName
} from '../functions';

import SocketConnection from './SocketConnection.web';
import JaneDialog from './dialogs/JaneDialog';
import DeviceStatus from './preview/DeviceStatus';
import Preview from './preview/Preview';

type Props = {
    t: Function,
    deviceStatusVisible: boolean,
    name: string,
};

class JaneWaitingArea extends Component<Props> {

    render() {
        const {
            name,
            deviceStatusVisible
        } = this.props;

        return (
            <div className = 'jane-waiting-area-full-page'>
                <Watermarks />
                <Preview name = { name } />
                <JaneDialog />
                {deviceStatusVisible && <DeviceStatus />}
                <SocketConnection />
            </div>
        );
    }
}

function mapStateToProps(state): Object {
    return {
        deviceStatusVisible: isDeviceStatusVisible(state),
        name: getJaneWaitingAreaPageDisplayName(state)
    };
}

export default connect(mapStateToProps)(translate(JaneWaitingArea));
