// @flow
import {
    ColorPalette,
    calcFontSize,
    deviceHasNotch,
    calcPixelByWidthRatio,
    calcPixelByHeightRatio, JaneWeb
} from '../../../base/styles';
import { StyleSheet, Platform } from 'react-native';

const isIpad = Platform.isPad;
const WHITE_COLOR = ColorPalette.white;
const DARK_TEXT_COLOR = ColorPalette.janeDark;
const INNER_CONTAINER_BACKGROUND = ColorPalette.janeLight;

// Numbers below are from desgin mock up.
const UPPER_SECTION_HEIGHT_ON_IPAD = 866;
const UPPER_SECTION_HEIGHT_ON_IPHONE = 746;
const BUTTON_WRAPPER_HEIGHT_ON_IPAD = 184;
const BUTTON_WRAPPER_HEIGHT_ON_IPHONE = 98;

const commonStyles = {
    blankPageWrapper: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ColorPalette.jane
    },
    wrapper: {
        flex: 1,
        paddingHorizontal: calcPixelByWidthRatio(23),
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        paddingTop: calcPixelByHeightRatio(deviceHasNotch() ? 10 : 15)
    },
    bigText: {
        ...JaneWeb.boldFont,
        textAlign: 'center',
        color: DARK_TEXT_COLOR,
        marginBottom: calcPixelByHeightRatio(20),
        fontSize: calcFontSize(28)
    },
    regularText: {
        ...JaneWeb.medium,
        color: DARK_TEXT_COLOR,
        textAlign: 'left',
        marginVertical: calcPixelByHeightRatio(28),
        fontSize: calcFontSize(18)
    },
    logo: {
        backgroundColor: ColorPalette.jane,
        height: undefined,
        aspectRatio: 1437 / 1188,
        width: calcFontSize(204)
    },
    logoBlue: {
        height: undefined,
        aspectRatio: 450 / 370,
        width: calcFontSize(204)
    },
    mainContainer: {
        height: calcPixelByHeightRatio(isIpad ? UPPER_SECTION_HEIGHT_ON_IPAD : UPPER_SECTION_HEIGHT_ON_IPHONE),
        backgroundColor: INNER_CONTAINER_BACKGROUND,
        borderRadius: 6,
        flexDirection: 'column',
        alignItems: 'space-between',
        paddingHorizontal: calcPixelByWidthRatio(25) },
    fullIphoneScreenContainer: {
        height: isIpad ? calcPixelByHeightRatio(UPPER_SECTION_HEIGHT_ON_IPAD) : undefined
    },
    innerUpperContainer: {
        width: '100%',
        alignItems: 'center',
        height: calcPixelByHeightRatio(668) },
    innerLowerContainer: {
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        height: calcPixelByHeightRatio(123) },
    buttonContainer: {
        height: calcPixelByHeightRatio(isIpad ? BUTTON_WRAPPER_HEIGHT_ON_IPAD : BUTTON_WRAPPER_HEIGHT_ON_IPHONE),
        opacity: 0.86,
        borderRadius: 6,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center' }
};

const stepsScreenStyles = {
    stepOne: {
        mainContainer: {
            ...commonStyles.mainContainer,
            paddingTop: calcPixelByHeightRatio(isIpad ? 244 : 64) },
        innerUpperContainer: {
            width: '100%',
            alignItems: 'center' },
        insideLowerContainer: {
            flex: 1,
            justifyContent: 'flex-end',
            width: '100%',
            marginBottom: calcPixelByHeightRatio(isIpad ? 41 : 25)
        },
        messageText: {
            ...commonStyles.regularText,
            maxWidth: isIpad ? calcPixelByWidthRatio(300) : undefined
        },
        header: {
            ...commonStyles.bigText,
            maxWidth: isIpad ? undefined : calcPixelByWidthRatio(240),
            marginBottom: calcPixelByHeightRatio(isIpad ? 66 : 20)
        },
        logo: {
            ...commonStyles.logoBlue,
            marginBottom: calcPixelByHeightRatio(isIpad ? 26 : 57)
        }
    },
    stepTwo: {
        mainContainer: {
            ...commonStyles.mainContainer,
            ...commonStyles.fullIphoneScreenContainer
        },
        innerUpperContainer: {
            ...commonStyles.innerUpperContainer,
            paddingTop: calcPixelByHeightRatio(64) },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer,
            flex: isIpad ? 1 : 0,
            marginBottom: calcPixelByHeightRatio(isIpad ? 41 : 25)
        },
        header: {
            ...commonStyles.bigText,
            maxWidth: calcPixelByWidthRatio(isIpad ? 600 : 293),
            marginBottom: calcPixelByWidthRatio(isIpad ? 30 : 22)
        },
        logo: {
            ...commonStyles.logoBlue,
            marginBottom: calcPixelByHeightRatio(57)
        }
    },
    stepThree: {
        mainContainer: {
            ...commonStyles.mainContainer,
            ...commonStyles.fullIphoneScreenContainer
        },
        header: {
            ...commonStyles.bigText,
            marginTop: calcPixelByHeightRatio(isIpad ? 101 : 51),
            marginBottom: calcPixelByHeightRatio(30),
            maxWidth: calcPixelByWidthRatio(450)
        },
        innerUpperContainer: {
            ...commonStyles.innerUpperContainer,
            paddingTop: calcPixelByHeightRatio(isIpad ? 138 : 64) },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer,
            flex: isIpad ? 1 : 0,
            justifyContent: 'flex-end',
            marginBottom: calcPixelByHeightRatio(isIpad ? 41 : 25)
        }
    },
    stepFour: {
        mainContainer: {
            ...commonStyles.mainContainer,
            ...commonStyles.fullIphoneScreenContainer,
            justifyContent: 'space-between'
        },
        innerUpperContainer: {
            ...commonStyles.innerUpperContainer,
            paddingTop: calcPixelByHeightRatio(isIpad ? 80 : 34) },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer,
            justifyContent: 'flex-end',
            marginBottom: calcPixelByHeightRatio(isIpad ? 41 : 25)
        },
        message: {
            ...commonStyles.regularText,
            textAlign: 'left',
            marginVertical: calcPixelByHeightRatio(28),
            maxWidth: calcPixelByWidthRatio(320),
            fontSize: calcFontSize(17)
        },
        header: {
            ...commonStyles.bigText,
            maxWidth: calcPixelByWidthRatio(isIpad ? 430 : 280)
        },
        mobileScreen: {
            height: calcPixelByHeightRatio(379),
            aspectRatio: 468 / 758,
            marginBottom: calcPixelByHeightRatio(9.5),
            marginTop: calcPixelByHeightRatio(10)
        }
    },
    done: {
        mainContainer: {
            ...commonStyles.mainContainer,
            alignItems: 'center',
            backgroundColor: undefined,
            paddingTop: calcPixelByHeightRatio(isIpad ? 289 : 102) },
        buttonContainer: {
            height: calcPixelByHeightRatio(isIpad ? BUTTON_WRAPPER_HEIGHT_ON_IPAD : BUTTON_WRAPPER_HEIGHT_ON_IPHONE),
            borderRadius: 6,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center' },
        header: {
            ...commonStyles.bigText,
            color: WHITE_COLOR,
            marginTop: calcPixelByHeightRatio(isIpad ? 40 : 96),
            marginBottom: calcPixelByHeightRatio(30),
            fontSize: calcFontSize(24)
        }
    },
    noEmail: {
        mainContainer: {
            ...commonStyles.mainContainer,
            ...commonStyles.fullIphoneScreenContainer,
            justifyContent: 'space-between'
        },
        innerUpperContainer: {
            ...commonStyles.innerUpperContainer,
            paddingTop: calcPixelByHeightRatio(isIpad ? 80 : 34) },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer,
            height: calcPixelByHeightRatio(isIpad ? 100 : 123),
            marginBottom: calcPixelByHeightRatio(isIpad ? 41 : 25)
        },
        regularText: {
            ...commonStyles.regularText,
            marginBottom: calcPixelByHeightRatio(28),
            fontSize: calcFontSize(isIpad ? 18 : 17),
            maxWidth: calcPixelByWidthRatio(600)
        },
        boldText: {
            fontWeight: 'bold'
        },
        header: {
            ...commonStyles.bigText,
            fontSize: calcFontSize(isIpad ? 28 : 26)
        },
        mobileScreen: {
            height: calcPixelByHeightRatio(180),
            aspectRatio: 810 / 540,
            marginBottom: calcPixelByHeightRatio(isIpad ? 57 : 9.5),
            marginTop: calcPixelByHeightRatio(isIpad ? 64 : 10)
        }
    },
    staff: {
        mainContainer: {
            ...commonStyles.mainContainer,
            height: isIpad ? calcPixelByHeightRatio(1015) : undefined,
            paddingHorizontal: calcPixelByWidthRatio(26)
        },
        innerUpperContainer: {
            ...commonStyles.innerUpperContainer,
            height: calcPixelByHeightRatio(isIpad ? 835 : 668),
            paddingTop: calcPixelByHeightRatio(isIpad ? 150 : 34) },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer,
            justifyContent: isIpad ? 'center' : 'flex-end',
            height: calcPixelByHeightRatio(isIpad ? 180 : 133),
            paddingBottom: calcPixelByHeightRatio(25)
        },
        lightText: {
            ...JaneWeb.regularFont,
            color: DARK_TEXT_COLOR,
            width: '100%',
            textAlign: 'left',
            marginVertical: calcPixelByHeightRatio(isIpad ? 15 : 9),
            fontSize: calcFontSize(18),
            maxWidth: calcPixelByWidthRatio(371)
        },
        boldText: {
            fontWeight: 'bold'
        },
        mobileScreen: {
            height: calcPixelByHeightRatio(418),
            aspectRatio: 717 / 1257,
            marginBottom: calcPixelByHeightRatio(9.5),
            marginTop: calcPixelByHeightRatio(isIpad ? 65 : 10)
        }
    }
};

const tutorialStyles = { ...commonStyles,
    ...stepsScreenStyles };

export default tutorialStyles;
