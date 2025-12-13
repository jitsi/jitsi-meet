import { IStore } from '../app/types';
import { ENDPOINT_MESSAGE_RECEIVED } from '../base/conference/actionTypes';
import {
    participantJoined,
    participantLeft
} from '../base/participants/actions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

/**
 * Middleware that handles endpoint messages for fake participants.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: any) => {
    if (action.type === ENDPOINT_MESSAGE_RECEIVED) {
        const { data } = action;
        const { type, participant, participantId } = data;

        switch (type) {
        case 'add-fake-participant': {
            const { conference } = store.getState()['features/base/conference'];

            store.dispatch(participantJoined({
                ...participant,
                conference
            }));
            break;
        }
        case 'remove-fake-participant': {
            store.dispatch(participantLeft(participantId));
            break;
        }
        }
    }

    return next(action);
});
