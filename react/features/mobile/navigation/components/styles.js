import { BoxModel } from '../../../base/styles';
import BaseTheme from '../../../base/ui/components/BaseTheme';


export const TEXT_COLOR = BaseTheme.palette.text01;

/**
 * Styles of the navigation feature.
 */
export const navigationStyles = {
    connectingScreenContainer: {
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1
    },

    connectingScreenContent: {
        alignItems: 'center',
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center'
    },

    connectingScreenIndicator: {
        margin: BoxModel.margin
    },

    connectingScreenText: {
        color: TEXT_COLOR
    }
};
