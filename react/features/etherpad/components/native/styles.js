// @flow

import { ColorPalette } from '../../../base/styles';

export const INDICATOR_COLOR = ColorPalette.lightGrey;

export default {
    indicatorWrapper: {
        alignItems: 'center',
        backgroundColor: ColorPalette.white,
        height: '100%',
        justifyContent: 'center'
    },

    sharedDocContainer: {
        flex: 1
    },

    webView: {
        backgroundColor: 'rgb(242, 242, 242)'
    }
};
