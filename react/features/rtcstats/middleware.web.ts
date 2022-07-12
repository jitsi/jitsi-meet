// @ts-ignore
import { CONFERENCE_UNIQUE_ID_SET } from '../base/conference';
// @ts-ignore
import { MiddlewareRegistry } from '../base/redux';
import { IStore } from '../app/types';

import { connectAndSendIdentity } from './functions';
import './middleware.any';


MiddlewareRegistry.register((store: IStore) => (next: Function) => (action:any) => {
    const state = store.getState();
    const { dispatch } = store;

    switch (action.type) {
    case CONFERENCE_UNIQUE_ID_SET: {
        connectAndSendIdentity(dispatch, state, action.conference);
        break;
    }
    }

    return next(action);
});
