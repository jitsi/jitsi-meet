import ReducerRegistry from '../base/redux/ReducerRegistry';

import { SET_VIDEO_PERMISSION_PROMPT } from './actionTypes';
import { CaptureKind } from './functions';

export interface IPermissionPrompt {

    /**
     * The devices about to be requested.
     */
    kinds: CaptureKind[];

    /**
     * Invoked with whether to go ahead with the request.
     */
    onDone: (allowed: boolean) => void;

    /**
     * The other device, offered when unmuting one of them.
     */
    otherKind?: CaptureKind;
}

export interface IDevicePermissionsState {

    /**
     * The explanation shown above the camera button, before the camera is requested.
     */
    videoPrompt?: IPermissionPrompt & { id: number; };
}

ReducerRegistry.register<IDevicePermissionsState>(
    'features/device-permissions', (state = {}, action): IDevicePermissionsState => {
        switch (action.type) {
        case SET_VIDEO_PERMISSION_PROMPT:
            return {
                ...state,
                videoPrompt: action.prompt
            };
        }

        return state;
    });
