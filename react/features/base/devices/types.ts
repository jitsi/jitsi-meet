/* eslint-disable lines-around-comment */

/**
 * The permission status of a capture device, as reported by lib-jitsi-meet.
 */
export interface IPermissionStatus {
    reason?: 'browser' | 'os' | 'policy' | 'user';
    state: 'denied' | 'granted' | 'prompt';
}

export interface IDevicesState {
    availableDevices: {
        // @ts-ignore
        audioInput?: MediaDeviceInfo[];
        // @ts-ignore
        audioOutput?: MediaDeviceInfo[];
        // @ts-ignore
        videoInput?: MediaDeviceInfo[];
    };
    pendingRequests: any[];
    permissionStatus: {
        audio?: IPermissionStatus;
        video?: IPermissionStatus;
    };
    permissions: {
        audio: boolean;
        video: boolean;
    };
}
