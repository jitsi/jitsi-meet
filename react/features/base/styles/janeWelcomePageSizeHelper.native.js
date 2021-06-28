// eslint-disable-next-line require-jsdoc
import { Dimensions, PixelRatio } from 'react-native';
const { height, width } = Dimensions.get('window');

/**
 * Size helper for Jane welcome page.
 * we need to re-calculate the dp size to adapt different iphone/ipads devices.
 */
export default class JaneWelcomePageSizeHelperNative {
    /**
     * Constructor.
     *
     * @param {Object}  options - Object.
     * @returns {void}
     */
    constructor(options) {
        this.designWidth = options.designWidth || 0;
        this.designHeight = options.designHeight || 0;
        this.designSafeAreaPadding = options.designSafeAreaPadding || 0;
        this.scaleWidthRatio = width / this.designWidth;
        this.scaleHeightRatio = (height - this.designSafeAreaPadding) / this.designHeight;
    }

    /**
     * Calculate actual horizontal direction dp from the the design mockup mesaurements.
     *
     * @param {number}  size - Number.
     * @returns {number}
     */
    getActualSizeW(size) {
        if (!size) {
            return 0;
        }

        return PixelRatio.roundToNearestPixel(size * this.scaleWidthRatio);
    }

    /**
     * Calculate actual vertical direction dp from the the design mockup mesaurements.
     *
     * @param {number}  size - Number.
     * @returns {number}
     */
    getActualSizeH(size) {
        if (!size) {
            return 0;
        }

        return PixelRatio.roundToNearestPixel(size * this.scaleHeightRatio);
    }
}
