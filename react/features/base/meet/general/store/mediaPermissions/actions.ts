import { HIDE_PERMISSIONS_MODAL, SHOW_PERMISSIONS_MODAL } from "./actionTypes";

export const showPermissionsModal = () => ({
    type: SHOW_PERMISSIONS_MODAL,
});

export const hidePermissionsModal = () => ({
    type: HIDE_PERMISSIONS_MODAL,
});