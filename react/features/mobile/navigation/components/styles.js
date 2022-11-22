import { BoxModel } from '../../../base/styles';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';


export const TEXT_COLOR = BaseTheme.palette.text01;

const HEADER_ACTION_BUTTON_SIZE = 17;

const headerNavigationButton = {
    alignItems: 'center',
    justifyContent: 'center'
};

const headerNavigationText = {
    ...BaseTheme.typography.bodyShortBoldLarge,
    color: BaseTheme.palette.link01,
    fontSize: HEADER_ACTION_BUTTON_SIZE
};

const unreadCounterDescription = {
    ...BaseTheme.typography.bodyShortBoldLarge,
    color: BaseTheme.palette.text03
};

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
    },

    headerNavigationButtonIcon: {
        ...headerNavigationButton,
        height: BaseTheme.spacing[5],
        paddingLeft: BaseTheme.spacing[3],
        width: BaseTheme.spacing[5]
    },

    headerNavigationButtonText: {
        ...headerNavigationButton,
        height: BaseTheme.spacing[9],
        width: BaseTheme.spacing[9]
    },

    headerNavigationText: {
        ...headerNavigationText,
        marginLeft: BaseTheme.spacing[2]
    },

    headerNavigationTextBold: {
        ...headerNavigationText,
        ...BaseTheme.typography.bodyShortRegularLarge,
        marginRight: BaseTheme.spacing[1]
    },

    unreadCounterContainer: {
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'row'
    },

    unreadCounterDescription: {
        ...unreadCounterDescription
    },

    unreadCounterDescriptionFocused: {
        ...unreadCounterDescription,
        color: BaseTheme.palette.text01
    },

    unreadCounterCircle: {
        backgroundColor: BaseTheme.palette.warning01,
        borderRadius: BaseTheme.spacing[4] / 2,
        height: BaseTheme.spacing[4],
        justifyContent: 'center',
        marginLeft: BaseTheme.spacing[2],
        width: BaseTheme.spacing[4]
    },

    unreadCounter: {
        ...BaseTheme.typography.bodyShortBold,
        alignSelf: 'center',
        color: BaseTheme.palette.text04
    }
};
