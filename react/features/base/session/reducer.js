import { ReducerRegistry } from '../redux';

import { SESSION_CREATED, SESSION_FAILED, SESSION_TERMINATED } from './actionTypes';

ReducerRegistry.register('features/base/session', (state = new Map(), action) => {
    switch (action.type) {
    case SESSION_CREATED: {
        const { session } = action;
        const nextMap = new Map(state);

        nextMap.set(session.id, session);

        return nextMap;
    }
    case SESSION_TERMINATED:
    case SESSION_FAILED: {
        const { session } = action;
        const nextMap = new Map(state);

        nextMap.delete(session.id);

        return nextMap;
    }
    }

    return state;
});
