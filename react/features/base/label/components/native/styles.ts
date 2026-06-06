import { ColorPalette } from '../../../styles/components/styles/ColorPalette';
import BaseTheme from '../../../ui/components/BaseTheme.native';

/**
 * The default color of the {@code Label} and {@code ExpandedLabel}.
 */
export const DEFAULT_COLOR = '#36383C';

/**
 * Margin of the {@Label} - to be reused when rendering the
 * {@code ExpandedLabel}.
 */
export const LABEL_MARGIN = 8;

/**
 * Size of the {@Label} - to be reused when rendering the
 * {@code ExpandedLabel}.
 */
export const LABEL_SIZE = 28;

/**
 * The styles of the native base/label feature.
 */
export default {
    expandedLabelContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 36,
        flexDirection: 'row',
        justifyContent: 'center',
        zIndex: 1
    },

    expandedLabelTextContainer: {
        borderRadius: 3,
        paddingHorizontal: LABEL_MARGIN,
        paddingVertical: LABEL_MARGIN / 2
    },

    expandedLabelText: {
        color: ColorPalette.white
    },

    /**
     * The outermost view.
     */
    labelContainer: {
        alignItems: 'space-between',
        backgroundColor: DEFAULT_COLOR,
        borderRadius: 3,
        flex: 0,
        height: LABEL_SIZE,
        justifyContent: 'center',
        marginLeft: LABEL_MARGIN,
        marginBottom: LABEL_MARGIN,
        paddingHorizontal: 8
    },

    labelText: {
        color: ColorPalette.white,
        ...BaseTheme.typography.labelBold
    },

    labelOff: {
        opacity: 0.3
    }
};
