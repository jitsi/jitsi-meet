import { StyleSheet } from 'react-native';

import { BoxModel } from '../../../base/styles';
import BaseTheme from '../../../base/ui/components/BaseTheme';


export const TEXT_COLOR = BaseTheme.palette.text01;

/**
 * Styles of the navigation feature.
 */
export const navigationStyles = {
    connectingScreenContainer: {
        flex: 1
    },

    connectingScreenContent: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.uiBackground,
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
