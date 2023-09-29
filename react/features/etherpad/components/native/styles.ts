import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export const INDICATOR_COLOR = BaseTheme.palette.ui07;

export default {
    indicatorWrapper: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui10,
        height: '100%',
        justifyContent: 'center'
    },

    sharedDocContainer: {
        backgroundColor: BaseTheme.palette.ui10,
        flex: 1,
        paddingRight: BaseTheme.spacing[3]
    },

    sharedDoc: {
        marginBottom: BaseTheme.spacing[3]
    },

    webView: {
        backgroundColor: BaseTheme.palette.ui10
    }
};
