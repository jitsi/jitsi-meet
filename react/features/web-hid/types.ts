export const EVENT_TYPE = {
    INIT_DEVICE: 'INIT_DEVICE',
    UPDATE_DEVICE: 'UPDATE_DEVICE'
};

export const HOOK_STATUS = {
    ON: 'on',
    OFF: 'off'
};

export const COMMANDS = {
    ON_HOOK: 'onHook',
    OFF_HOOK: 'offHook',
    MUTE_OFF: 'muteOff',
    MUTE_ON: 'muteOn',
    ON_RING: 'onRing',
    OFF_RING: 'offRing',
    ON_HOLD: 'onHold',
    OFF_HOLD: 'offHold'
};

export const INPUT_REPORT_EVENT_NAME = {
    ON_DEVICE_HOOK_SWITCH: 'ondevicehookswitch',
    ON_DEVICE_MUTE_SWITCH: 'ondevicemuteswitch'
};

export const ACTION_HOOK_TYPE_NAME = {
    HOOK_SWITCH_ON: 'HOOK_SWITCH_ON',
    HOOK_SWITCH_OFF: 'HOOK_SWITCH_OFF',
    MUTE_SWITCH_ON: 'MUTE_SWITCH_ON',
    MUTE_SWITCH_OFF: 'MUTE_SWITCH_OFF',
    VOLUME_CHANGE_UP: 'VOLUME_CHANGE_UP',
    VOLUME_CHANGE_DOWN: 'VOLUME_CHANGE_DOWN'
};

export interface IDeviceInfo {

    // @ts-ignore
    device: HIDDevice;
    hold: boolean;
    hookStatus: string;
    muted: boolean;
    ring: boolean;
}
