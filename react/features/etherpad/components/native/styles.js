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

    webView: {
        flex: 1
    },

    webViewWrapper: {
        flex: 1,
        flexDirection: 'column'
    }
};
