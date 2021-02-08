// eslint-disable-next-line require-jsdoc
import { Dimensions, PixelRatio } from 'react-native';
import { deviceHasNotch } from './functions.native';
const { height, width } = Dimensions.get('window');

/**
 * Size helper for Jane welcome page.
 * we need to re-calculate the dp size to adapt different iphone/ipads devices.
 */
export default class JaneWelcomePageSizeHelper {
    /**
     * constructor
     *
     * @param {Object}  options - Object.
     * @returns {void}
     */
    constructor(options) {
        this.mockUpWidth = options.mockUpWidth || 0;
        this.mockUpHeight = options.mockUpHeight || 0;
        this.mockUpSafeAreaPadding = options.mockUpSafeAreaPadding || 0;
        this.scaleWidthRatio = width / this.mockUpWidth;
        this.scaleHeighthRatio = (height - this.mockUpSafeAreaPadding) / this.mockUpHeight;
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

        return PixelRatio.roundToNearestPixel(size * this.scaleHeighthRatio);
    }

    /**
     * Calculate actual font size from the the design mockup mesaurements.
     * Return the actual horizontal direction dp if the iphone has notch.
     *
     * @param {number}  size - Number.
     * @returns {number}
     */
    getActualFontSize(size) {
        if (!deviceHasNotch()) {
            return this.getActualSizeH(size);
        }

        return this.getActualSizeW(size);
    }
}
