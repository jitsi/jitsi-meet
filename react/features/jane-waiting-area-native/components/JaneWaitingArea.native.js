// @flow
/* eslint-disable require-jsdoc*/
import React, { Component } from 'react';
import { connect } from '../../base/redux';
import { translate } from '../../base/i18n';
import DialogBox from './DialogBox.native';

type Props = {
    appstate: Object,
    jwt: string
};

class JaneWaitingAreaNative extends Component<Props, State> {

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
