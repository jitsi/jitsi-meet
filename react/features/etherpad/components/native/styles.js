// @flow

import BaseTheme from '../../../base/ui/components/BaseTheme.native';


export const INDICATOR_COLOR = BaseTheme.palette.indicatorColor;

export default {
    indicatorWrapper: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui12,
        height: '100%',
        justifyContent: 'center'
    },

    sharedDocContainer: {
        backgroundColor: BaseTheme.palette.ui12,
        flex: 1,
        paddingRight: BaseTheme.spacing[3]
    },

    sharedDoc: {
        marginBottom: BaseTheme.spacing[3]
    },

    webView: {
        backgroundColor: BaseTheme.palette.ui12
    }
};
