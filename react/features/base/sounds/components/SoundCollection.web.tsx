import { Component } from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';

/**
 * Web override: do not render one <audio> per sound. Playback is handled by
 * SoundManager via middleware.
 */
class SoundCollection extends Component {
    override render() {
        return null;
    }
}

export default connect((_: IReduxState) => ({}))(SoundCollection);


