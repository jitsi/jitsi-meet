/* eslint-disable import/order */
import { IStore } from '../app/types';

// @ts-ignore
import { CONFERENCE_JOINED } from '../base/conference';

// @ts-ignore
import { MiddlewareRegistry } from '../base/redux';

import { connectAndSendIdentity } from './functions';
import './middleware.any';


MiddlewareRegistry.register((store: IStore) => (next: Function) => (action:any) => {
    const state = store.getState();
    const { dispatch } = store;

    switch (action.type) {
    case CONFERENCE_JOINED: {
        connectAndSendIdentity(dispatch, state, action.conference);
        break;
    }
    }

    return next(action);
});
