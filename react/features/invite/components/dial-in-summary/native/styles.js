// @flow

import BaseTheme from '../../../../base/ui/components/BaseTheme.native';

export const INDICATOR_COLOR = BaseTheme.palette.indicatorColor;

const WV_BACKGROUND = BaseTheme.palette.ui14;

export default {

    backDrop: {
        backgroundColor: WV_BACKGROUND,
        flex: 1
    },

    indicatorWrapper: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui12,
        height: '100%',
        justifyContent: 'center'
    },

    webView: {
        backgroundColor: WV_BACKGROUND,
        flex: 1
    }
};
