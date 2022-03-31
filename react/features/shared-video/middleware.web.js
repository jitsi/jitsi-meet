// @flow

import { getCurrentConference } from '../base/conference';
import { getLocalParticipant } from '../base/participants';
import { StateListenerRegistry } from '../base/redux';

import { setDisableButton } from './actions.web';
import { SHARED_VIDEO } from './constants';

import './middleware.any';

/**
 * Set up state change listener to disable or enable the share video button in
 * the toolbar menu.
 */
StateListenerRegistry.register(
    state => getCurrentConference(state),
    (conference, { dispatch, getState }, previousConference) => {
        if (conference && conference !== previousConference && !getState()['features/base/conference'].authRequired) {
            conference.addCommandListener(SHARED_VIDEO,
                ({ attributes }) => {
                    const { from } = attributes;
                    const localParticipantId = getLocalParticipant(getState()).id;
                    const status = attributes.state;

                    if (status === 'playing') {
                        if (localParticipantId !== from) {
                            dispatch(setDisableButton(true));
                        }
                    } else if (status === 'stop') {
                        dispatch(setDisableButton(false));
                    }
                }
            );
        }
    }
);
