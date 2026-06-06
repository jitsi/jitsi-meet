/**
 * Prefixes of devices that will be filtered from the device list.
 *
 * NOTE: It seems that the filtered devices can't be set
 * as default device on the OS level and this use case is not handled in the code. If we add more device prefixes that
 * can be default devices we should make sure to handle the default device use case.
 */
export const DEVICE_LABEL_PREFIXES_TO_IGNORE = [
    'Microsoft Teams Audio Device',
    'ZoomAudioDevice'
];
