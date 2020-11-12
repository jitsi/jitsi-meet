// @flow
/* eslint-disable */

import React, { Component } from 'react';
import { translate } from '../../base/i18n';
import { connect } from '../../base/redux';
import {
    isDeviceStatusVisible,
    getJaneWaitingAreaPageDisplayName,
    getLocalParticipantFromJwt,
    getLocalParticipantType,
    checkLocalParticipantCanJoin
} from '../functions';
import DeviceStatus from './preview/DeviceStatus';
import Preview from './preview/Preview';
import jwtDecode from 'jwt-decode';
import { Watermarks } from '../../base/react/components/web';
import JaneDialog from './dialogs/JaneDialog';
import SocketConnection from './SocketConnection.web';

type Props = {
    t: Function,
    jwt: string,
    jwtPayload: Object,
    participantType: string,
    participant: Object,
    deviceStatusVisible: boolean,
    joinConference: Function,
    name: string,
    remoteParticipantsStatuses: ?Array<any>
};

class JaneWaitingArea extends Component<Props> {

    render() {
        const {
            name,
            participantType,
            deviceStatusVisible,
            remoteParticipantsStatuses
        } = this.props;
        const localParticipantCanJoin = checkLocalParticipantCanJoin(remoteParticipantsStatuses, participantType);
        const hasWaitingMessage = participantType === 'Patient'
            && !localParticipantCanJoin;
        const waitingMessageHeader = hasWaitingMessage && 'Waiting for the practitioner...' || '';

        return (
            <div className='jane-waiting-area-full-page'>
                <Watermarks
                    hasWaitingMessage={hasWaitingMessage}
                    waitingMessageHeader={waitingMessageHeader}/>
                <Preview name={name}/>
                <JaneDialog/>
                {deviceStatusVisible && <DeviceStatus/>}
                <SocketConnection/>
            </div>
        );
    }
}

function mapStateToProps(state): Object {
    const { jwt } = state['features/base/jwt'];
    const { remoteParticipantsStatuses } = state['features/jane-waiting-area'];
    const jwtPayload = jwt && jwtDecode(jwt);
    const participant = getLocalParticipantFromJwt(state);
    const participantType = getLocalParticipantType(state);

    return {
        deviceStatusVisible: isDeviceStatusVisible(state),
        jwt,
        jwtPayload,
        participantType,
        participant,
        remoteParticipantsStatuses,
        name: getJaneWaitingAreaPageDisplayName(state)
    };
}

export default connect(mapStateToProps)(translate(JaneWaitingArea));
