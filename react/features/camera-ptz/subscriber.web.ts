import { pinParticipant } from '../base/participants/actions';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';

import { PTZControlState } from './constants';
import { getCameraPtzState } from './functions';

import './subscriber.any';

/**
 * Pins a camera that has just come under control, since the controls are drawn over the large video and driving a
 * camera from a thumbnail would leave the user aiming at a picture too small to see.
 */
StateListenerRegistry.register(
    state => getCameraPtzState(state).controller.state === PTZControlState.CONTROLLING,
    (controlling, { dispatch, getState }) => {
        const { target } = getCameraPtzState(getState()).controller;

        controlling && target && dispatch(pinParticipant(target));
    });
