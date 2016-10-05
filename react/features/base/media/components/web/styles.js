/**
 * Make video element fill its container.
 */
const video = {
    flex: 1,
    objectFit: 'cover',
    width: '100%'
};

/**
 * Transform local videos to behave like a mirror.
 */
const mirroredVideo = {
    ...video,
    transform: 'scaleX(-1)'
};

/**
 * Web-specific styles for media components.
 */
export const styles = {
    mirroredVideo,
    video
};
