/* eslint-disable lines-around-comment */

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
    permissions: {
        audio: boolean;
        video: boolean;
    };
}
