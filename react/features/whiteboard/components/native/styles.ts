import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export const INDICATOR_COLOR = BaseTheme.palette.whiteboardIndicatorColor;

const WV_BACKGROUND = BaseTheme.palette.whiteboardBackground;

export default {

    backDrop: {
        backgroundColor: WV_BACKGROUND,
        flex: 1
    },

    indicatorWrapper: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.whiteboardIndicatorBackground,
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
        color: BaseTheme.palette.whiteboardLink,
        fontWeight: 'bold'
    }
};
