import { ColorPalette, createStyleSheet } from '../../base/styles';

/**
 * Size for the Avatar.
 */
export const AVATAR_SIZE = 200;

export default createStyleSheet({
    /**
     * Large video container style.
     */
    largeVideo: {
        alignItems: 'stretch',
        backgroundColor: ColorPalette.appBackground,
        bottom: 0,
        flex: 1,
        justifyContent: 'center',
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0
    }
});
