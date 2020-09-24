// @flow

import React, { Component } from 'react';
import { connect } from '../../base/redux';
import jwtDecode from 'jwt-decode';
import { translate } from '../../base/i18n';
import DialogBox from './DialogBox.native';

type Props = {
    appstate: any
};

class PrejoinNative extends Component<Props, State> {

    constructor(props) {
        super(props);
    }

    render() {
        return (this.props.appstate.appState === 'active' &&
            <DialogBox/>) || null;
    }
}

function mapStateToProps(state): Object {
    const { jwt } = state['features/base/jwt'];
    const { socket } = state['features/jane-waiting-area-native'];
    const appstate = state['features/background'];
    const jwtPayload = jwt && jwtDecode(jwt) || null;
    const participant = jwtPayload && jwtPayload.context && jwtPayload.context.user || null;
    const participantType = participant && participant.participant_type || null;

    return {
        jwt,
        jwtPayload,
        participantType,
        participant,
        socket,
        appstate
    };
}

export default connect(mapStateToProps)(translate(PrejoinNative));
