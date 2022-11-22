import { BoxModel } from '../../../base/styles';
import BaseTheme from '../../../base/ui/components/BaseTheme.native';


export const TEXT_COLOR = BaseTheme.palette.text01;

const HEADER_ACTION_BUTTON_SIZE = 17;

const headerNavigationButton = {
    alignContent: 'center',
    height: '100%',
    justifyItems: 'center'
};

const headerNavigationText = {
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
        paddingTop: 18,
        width: BaseTheme.spacing[7]
    },

    headerNavigationButtonText: {
        ...headerNavigationButton,
        paddingTop: 10,
        width: BaseTheme.spacing[10]
    },

    headerNavigationIcon: {
        marginLeft: 12
    },

    headerNavigationText: {
        ...headerNavigationText,
        marginLeft: BaseTheme.spacing[3]
    },

    headerNavigationTextBold: {
        ...headerNavigationText,
        ...BaseTheme.typography.labelButton,
        marginRight: BaseTheme.spacing[3]
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
