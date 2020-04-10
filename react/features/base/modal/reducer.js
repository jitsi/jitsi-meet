// @flow

import { ReducerRegistry } from '../redux';

import { SET_ACTIVE_MODAL_ID } from './actionTypes';

ReducerRegistry.register('features/base/modal', (state = {}, action) => {
    switch (action.type) {
    case SET_ACTIVE_MODAL_ID:
        return {
            ...state,
            activeModalId: action.activeModalId,
            modalProps: action.modalProps
        };
    }

    return state;
});
