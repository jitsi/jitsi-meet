// @flow

import React, { Component } from 'react';
import { connect } from '../../base/redux';
import jwtDecode from 'jwt-decode';
import { translate } from '../../base/i18n';
import DialogBox from './DialogBox.native';
import { updateParticipantReadyStatus } from '../functions';

type Props = {
    appstate: any
};

class JaneWaitingAreaNative extends Component<Props, State> {

    constructor(props) {
        super(props);
    }

    componentDidUpdate(prevProps) {
        const { participantType, jwt, jwtPayload, participant } = this.props;

        if (prevProps.appstate !== this.props.appstate && this.props.appstate.appState === 'background') {
            updateParticipantReadyStatus(jwt, jwtPayload, participantType, participant, 'left');
        }
    }

    render() {
        return (this.props.appstate.appState === 'active'
            && <DialogBox />) || null;
    }
}

function mapStateToProps(state): Object {
    const { jwt } = state['features/base/jwt'];
    const appstate = state['features/background'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
    const participant = jwtPayload && jwtPayload.context && jwtPayload.context.user || null;
    const participantType = participant && participant.participant_type || null;

    return {
        jwt,
        jwtPayload,
        participantType,
        participant,
        appstate
    };
}

export default connect(mapStateToProps)(translate(JaneWaitingAreaNative));
