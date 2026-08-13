import { pinParticipant } from '../base/participants/actions';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { addStageParticipant } from '../filmstrip/actions.web';
import { isStageFilmstripAvailable } from '../filmstrip/functions.web';

import { PTZControlState } from './constants';
import { getCameraPtzState } from './functions';

import './subscriber.any';

/**
 * Brings a camera that has just come under control onto the stage. The controls are drawn over the stage tile, and a
 * camera being driven from a thumbnail would leave the user aiming at a picture too small to see.
 */
StateListenerRegistry.register(
    state => getCameraPtzState(state).controller.state === PTZControlState.CONTROLLING,
    (controlling, { dispatch, getState }) => {
        const { target } = getCameraPtzState(getState()).controller;

        if (!controlling || !target) {
            return;
        }

        dispatch(isStageFilmstripAvailable(getState())
            ? addStageParticipant(target, true)
            : pinParticipant(target));
    });
