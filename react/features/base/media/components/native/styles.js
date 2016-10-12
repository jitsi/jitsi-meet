import { StyleSheet } from 'react-native';

/**
 * Make video element fill its container.
 */
const video = {
    flex: 1
};

/**
 * Transform local videos to behave like a mirror.
 */
const mirroredVideo = {
    ...video,
    transform: [ { scaleX: -1 } ]
};

/**
 * Native-specific styles for media components.
 */
export const styles = StyleSheet.create({
    mirroredVideo,
    video
});
