import { AnyAction } from "redux";
import { HIDE_PERMISSIONS_MODAL, SHOW_PERMISSIONS_MODAL } from "./actionTypes";

export interface IMediaPermissionsState {
    isVisible: boolean;
}

const INITIAL_PERMISSIONS_MODAL_STATE: IMediaPermissionsState = {
    isVisible: false,
};

export default function mediaPermissions(
    state: IMediaPermissionsState = INITIAL_PERMISSIONS_MODAL_STATE,
    action: AnyAction
) {
    switch (action.type) {
        case SHOW_PERMISSIONS_MODAL:
            return {
                isVisible: true,
            };
        case HIDE_PERMISSIONS_MODAL:
            return {
                isVisible: false,
            };
        default:
            return state;
    }
}