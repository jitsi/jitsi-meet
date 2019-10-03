// Event triggered when the ActiveDeviceDetector finds an audio device that has audio input.
// Note it does not check if the input is valid or not it simply checks for intensity > 0.008.
// Event structure:
// { deviceId: string,
//   deviceLabel: string,
//   audioLevel: number }
// TO DO. Potentially use rnnoise service to get a more accurate reading.
export const ACTIVE_DEVICE_DETECTED = 'active_device_detected';
