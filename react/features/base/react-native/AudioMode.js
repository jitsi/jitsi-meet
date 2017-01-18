import { NativeModules } from 'react-native';
import { Platform } from '../react';

let AudioMode;

if (Platform.OS === 'ios') {
    AudioMode = NativeModules.AudioMode;
} else {
    // TODO(saghul): Implement for Android
    AudioMode = {
        DEFAULT: 0,
        AUDIO_CALL: 1,
        VIDEO_CALL: 2,
        setMode() {
            return Promise.resolve(null);
        }
    };
}

export default AudioMode;
