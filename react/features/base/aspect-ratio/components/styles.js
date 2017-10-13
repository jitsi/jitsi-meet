import { createStyleSheet, fixAndroidViewClipping } from '../../styles/index';

/**
 * The styles of the feature app.
 */
export default createStyleSheet({
    /**
     * The style for {@link AspectRatioDetector} root view used on react-native.
     */
    aspectRatioDetectorStyle: fixAndroidViewClipping({
        alignSelf: 'stretch',
        flex: 1
    })
});
