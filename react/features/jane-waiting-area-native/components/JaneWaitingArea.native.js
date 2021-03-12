// @flow
/* eslint-disable require-jsdoc*/
import React, { Component } from 'react';
import { connect } from '../../base/redux';
import { translate } from '../../base/i18n';
import DialogBox from './DialogBox.native';
import { updateParticipantReadyStatus } from '../functions';

type Props = {
    appstate: Object,
    jwt: string
};

class JaneWaitingAreaNative extends Component<Props, State> {
    componentDidMount() {
        const { jwt } = this.props;

        updateParticipantReadyStatus(jwt, 'waiting');
    }

    render() {
        return (this.props.appstate && this.props.appstate.appState === 'active'
            && <DialogBox />) || null;
    }
}

function mapStateToProps(state): Object {
    const appstate = state['features/background'];
    const { jwt } = state['features/base/jwt'];

    return {
        appstate,
        jwt
    };
}

export default connect(mapStateToProps)(translate(JaneWaitingAreaNative));
