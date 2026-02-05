import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export const INDICATOR_COLOR = BaseTheme.palette.ui07;

const WV_BACKGROUND = BaseTheme.palette.ui03;

export default {

    backDrop: {
        backgroundColor: WV_BACKGROUND,
        flex: 1
    },

    indicatorWrapper: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui10,
        height: '100%',
        justifyContent: 'center'
    },

    webView: {
        backgroundColor: WV_BACKGROUND,
        flex: 1
    },

    limitUrlText: {
        alignItems: 'center',
        display: 'flex',
        marginBottom: BaseTheme.spacing[2],
        textAlign: 'center'
    },

    limitUrl: {
        color: BaseTheme.palette.link01,
        fontWeight: 'bold'
    }
};
