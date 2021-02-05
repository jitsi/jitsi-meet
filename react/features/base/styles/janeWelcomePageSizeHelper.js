// eslint-disable-next-line require-jsdoc
import { Dimensions, PixelRatio, Platform } from 'react-native';
import { deviceHasNotch } from './functions.native';
const { height, width } = Dimensions.get('window');
const isPad = Platform.isPad;

// safe area view padding top + padding bottom
const SAFE_AREA_VIEW_PADDING = isPad ? 0 : deviceHasNotch() ? 78 : 34;

/**
 * Size helper for Jane welcome page.
 * Because the dimensions (height & width) from the welcome page design mockup are not standard.
 * e.g. design mockup iphone dimensions : (390 X 844)
 * e.g. design mockup iPad dimensions : (811 X 1080)
 * we need to re-calculate the pixel size to adapt different iphone/ipads devices.
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
        this.scaleWidthRatio = width / this.mockUpWidth;
        this.scaleHeighthRatio = (height - SAFE_AREA_VIEW_PADDING) / this.mockUpHeight;
    }

    /**
     * Calculate actual horizontal direction size from the the design mockup mesaurements.
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
     * Calculate actual vertical direction size from the the design mockup mesaurements.
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
     * Return the actual horizontal direction size if the iphone has notch.
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
