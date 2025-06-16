import ReducerRegistry from '../base/redux/ReducerRegistry';

import { TOGGLE_SHARE_DIALOG } from './actionTypes';

const DEFAULT_STATE = {
    shareDialogVisible: false
};

export interface IShareRoomState {
    shareDialogVisible: boolean;
}

ReducerRegistry.register<IShareRoomState>('features/share-room', (state = DEFAULT_STATE, action): IShareRoomState => {
    switch (action.type) {
    case TOGGLE_SHARE_DIALOG:
        return {
            ...state,
            shareDialogVisible: action.visible
        };
    }

    return state;
});
