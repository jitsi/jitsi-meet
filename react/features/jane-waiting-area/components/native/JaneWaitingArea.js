// @flow
/* eslint-disable require-jsdoc*/
import React, { Component } from 'react';

import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';

import DialogBox from './DialogBox';

type Props = {
    appstate: Object,
    jwt: string
};

class JaneWaitingArea extends Component<Props> {

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

export default connect(mapStateToProps)(translate(JaneWaitingArea));
