// @flow

import { BoxModel, ColorPalette } from '../../styles';

/**
 * The default color of the {@code Label} and {@code ExpandedLabel}.
 */
export const DEFAULT_COLOR = '#808080';

/**
 * Margin of the {@Label} - to be reused when rendering the
 * {@code ExpandedLabel}.
 */
export const LABEL_MARGIN = 5;

/**
 * Size of the {@Label} - to be reused when rendering the
 * {@code ExpandedLabel}.
 */
export const LABEL_SIZE = 36;

/**
 * The styles of the native base/label feature.
 */
export default {

    expandedLabelArrow: {
        backgroundColor: ColorPalette.blue,
        height: 15,
        transform: [ { rotate: '45deg' }, { translateX: 10 } ],
        width: 15
    },

    expandedLabelContainer: {
        backgroundColor: ColorPalette.blue,
        borderColor: ColorPalette.blue,
        borderRadius: 6,
        marginHorizontal: BoxModel.margin,
        padding: BoxModel.padding
    },

    expandedLabelText: {
        color: ColorPalette.white
    },

    expandedLabelWrapper: {
        alignItems: 'flex-end',
        flexDirection: 'column'
    },

    /**
     * The outermost view.
     */
    indicatorContainer: {
        alignItems: 'center',
        backgroundColor: DEFAULT_COLOR,
        borderRadius: LABEL_SIZE / 2,
        borderWidth: 0,
        flex: 0,
        height: LABEL_SIZE,
        justifyContent: 'center',
        margin: LABEL_MARGIN,
        opacity: 0.6,
        width: LABEL_SIZE
    },

    indicatorIcon: {
        fontSize: 24
    },

    indicatorText: {
        color: ColorPalette.white,
        fontSize: 10
    },

    labelOff: {
        opacity: 0.3
    }
};
