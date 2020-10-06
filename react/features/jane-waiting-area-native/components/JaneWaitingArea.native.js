// @flow

import React, { Component } from 'react';
import { connect } from '../../base/redux';
import { translate } from '../../base/i18n';
import DialogBox from './DialogBox.native';

type Props = {
    appstate: any
};

class JaneWaitingAreaNative extends Component<Props, State> {

    constructor(props) {
        super(props);
    }

    render() {
        return (this.props.appstate.appState === 'active'
            && <DialogBox />) || null;
    }
}

function mapStateToProps(state): Object {
    const appstate = state['features/background'];

    return {
        appstate
    };
}

export default connect(mapStateToProps)(translate(JaneWaitingAreaNative));
