import { IStore } from '../app/types';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { IJitsiConference } from '../base/conference/reducer';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { PARTICIPANT_LEFT } from '../base/participants/actionTypes';
import { IJitsiParticipant } from '../base/participants/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { setParticipantPtzCapability } from './actions';
import { CAMERA_PTZ_CAPABILITY_PROPERTY } from './constants';

import './subscriber';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CONFERENCE_JOINED:
        _watchPtzCameraAdvertisements(store, action.conference);
        break;
    case PARTICIPANT_LEFT:
        store.dispatch(setParticipantPtzCapability(action.participant.id, false));
        break;
    }

    return next(action);
});

/**
 * Tracks which participants advertise a controllable camera, both the ones already in the conference and the ones
 * that start or stop offering theirs later.
 *
 * @param {IStore} store - The redux store.
 * @param {IJitsiConference} conference - The conference that was joined.
 * @returns {void}
 */
function _watchPtzCameraAdvertisements(store: IStore, conference: IJitsiConference) {
    const update = (participant: IJitsiParticipant, value: unknown) =>
        store.dispatch(setParticipantPtzCapability(participant.getId(), String(value) === 'true'));

    conference.getParticipants().forEach((participant: IJitsiParticipant) => {
        const value = participant.getProperty(CAMERA_PTZ_CAPABILITY_PROPERTY);

        value === undefined || update(participant, value);
    });

    conference.on(
        JitsiConferenceEvents.PARTICIPANT_PROPERTY_CHANGED,
        (participant: IJitsiParticipant, propertyName: string, _oldValue: unknown, newValue: unknown) => {
            propertyName === CAMERA_PTZ_CAPABILITY_PROPERTY && update(participant, newValue);
        });
}
