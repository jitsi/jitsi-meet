// @ts-ignore
import { IStore } from '../app/types';
// @ts-ignore
import { MiddlewareRegistry } from '../base/redux';
import { PARTICIPANTS_PANE_CLOSE, PARTICIPANTS_PANE_OPEN } from './actionTypes';


declare var APP: any;

/**
 * Middleware which intercepts participants pane actions.
 *
 * @param {IStore} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register((store: IStore) => (next:Function) => (action:any) => {
    switch(action.type) {
        case PARTICIPANTS_PANE_OPEN:
            if (typeof APP !== 'undefined') {
                APP.API.notifyParticipantsPaneToggled(true);
            }
            break;
        case PARTICIPANTS_PANE_CLOSE:
            if (typeof APP !== 'undefined') {
                APP.API.notifyParticipantsPaneToggled(false);
            }
            break;
    }
    return next(action);
});
