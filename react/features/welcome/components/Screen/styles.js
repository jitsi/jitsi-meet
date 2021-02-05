// @flow
import {
    ColorPalette,
    deviceHasNotch,
    JaneWeb,
    sizeHelper
} from '../../../base/styles';
import { StyleSheet, Platform } from 'react-native';

const isPad = Platform.isPad;
const WHITE_COLOR = ColorPalette.white;
const JANE_COLOR = ColorPalette.jane;
const DARK_TEXT_COLOR = ColorPalette.janeDarkGrey;
const INNER_CONTAINER_BACKGROUND = ColorPalette.janeLight;

// Numbers below are from desgin mock up.
const UPPER_SECTION_HEIGHT_ON_IPAD = 866;
const UPPER_SECTION_HEIGHT_ON_IPHONE = 746;
const LOWER_SECTION_HEIGHT_ON_IPAD = 184;
const LOWER_SECTION_HEIGHT_ON_IPHONE = 98;

const commonStyles = {
    blankPageWrapper: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: JANE_COLOR
    },
    wrapper: {
        flex: 1,
        paddingHorizontal: sizeHelper.getActualSizeW(23),
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        paddingTop: sizeHelper.getActualSizeH(deviceHasNotch() ? 10 : 15)
    },
    bigText: {
        ...JaneWeb.boldFont,
        textAlign: 'center',
        color: DARK_TEXT_COLOR,
        marginBottom: sizeHelper.getActualSizeH(20),
        fontSize: sizeHelper.getActualFontSize(28)
    },
    regularText: {
        ...JaneWeb.mediumFont,
        color: DARK_TEXT_COLOR,
        textAlign: 'left',
        marginVertical: sizeHelper.getActualSizeH(28),
        fontSize: sizeHelper.getActualFontSize(18)
    },
    logo: {
        backgroundColor: JANE_COLOR,
        height: undefined,
        aspectRatio: 1437 / 1188,
        width: sizeHelper.getActualFontSize(204)
    },
    logoBlue: {
        height: undefined,
        aspectRatio: 450 / 370,
        width: sizeHelper.getActualFontSize(204)
    },
    mainContainer: {
        height: sizeHelper.getActualSizeH(isPad ? UPPER_SECTION_HEIGHT_ON_IPAD : UPPER_SECTION_HEIGHT_ON_IPHONE),
        backgroundColor: INNER_CONTAINER_BACKGROUND,
        borderRadius: 6,
        flexDirection: 'column',
        alignItems: 'space-between',
        paddingHorizontal: sizeHelper.getActualSizeW(25) },
    fullIphoneScreenContainer: {
        height: isPad ? sizeHelper.getActualSizeH(UPPER_SECTION_HEIGHT_ON_IPAD) : undefined
    },
    innerUpperContainer: {
        width: '100%',
        alignItems: 'center',
        height: sizeHelper.getActualSizeH(668) },
    innerLowerContainer: {
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        height: sizeHelper.getActualSizeH(123) },
    buttonContainer: {
        height: sizeHelper.getActualSizeH(isPad ? LOWER_SECTION_HEIGHT_ON_IPAD : LOWER_SECTION_HEIGHT_ON_IPHONE),
        borderRadius: 6,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center' }
};

const stepsScreenStyles = {
    stepOne: {
        mainContainer: {
            ...commonStyles.mainContainer,
            paddingTop: sizeHelper.getActualSizeH(isPad ? 244 : 64) },
        innerUpperContainer: {
            width: '100%',
            alignItems: 'center' },
        insideLowerContainer: {
            flex: 1,
            justifyContent: 'flex-end',
            width: '100%',
            marginBottom: sizeHelper.getActualSizeH(isPad ? 41 : 25)
        },
        messageText: {
            ...commonStyles.regularText,
            maxWidth: isPad ? sizeHelper.getActualSizeW(300) : undefined
        },
        header: {
            ...commonStyles.bigText,
            maxWidth: isPad ? undefined : sizeHelper.getActualSizeW(240),
            marginBottom: sizeHelper.getActualSizeH(isPad ? 66 : 20)
        },
        logo: {
            ...commonStyles.logoBlue,
            marginBottom: sizeHelper.getActualSizeH(isPad ? 26 : 57)
        }
    },
    stepTwo: {
        mainContainer: {
            ...commonStyles.mainContainer,
            ...commonStyles.fullIphoneScreenContainer
        },
        innerUpperContainer: {
            ...commonStyles.innerUpperContainer,
            paddingTop: sizeHelper.getActualSizeH(64) },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer,
            flex: isPad ? 1 : 0,
            marginBottom: sizeHelper.getActualSizeH(isPad ? 41 : 25)
        },
        header: {
            ...commonStyles.bigText,
            maxWidth: sizeHelper.getActualSizeW(isPad ? 600 : 293),
            marginBottom: sizeHelper.getActualSizeW(isPad ? 30 : 22)
        },
        logo: {
            ...commonStyles.logoBlue,
            marginBottom: sizeHelper.getActualSizeH(57)
        }
    },
    stepThree: {
        mainContainer: {
            ...commonStyles.mainContainer,
            ...commonStyles.fullIphoneScreenContainer
        },
        header: {
            ...commonStyles.bigText,
            marginTop: sizeHelper.getActualSizeH(isPad ? 101 : 51),
            marginBottom: sizeHelper.getActualSizeH(30),
            maxWidth: sizeHelper.getActualSizeW(450)
        },
        innerUpperContainer: {
            ...commonStyles.innerUpperContainer,
            paddingTop: sizeHelper.getActualSizeH(isPad ? 138 : 64) },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer,
            flex: isPad ? 1 : 0,
            justifyContent: 'flex-end',
            marginBottom: sizeHelper.getActualSizeH(isPad ? 41 : 25)
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
            paddingTop: sizeHelper.getActualSizeH(isPad ? 80 : 34) },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer,
            justifyContent: 'flex-end',
            marginBottom: sizeHelper.getActualSizeH(isPad ? 41 : 25)
        },
        message: {
            ...commonStyles.regularText,
            textAlign: 'left',
            marginVertical: sizeHelper.getActualSizeH(28),
            maxWidth: sizeHelper.getActualSizeW(320),
            fontSize: sizeHelper.getActualFontSize(17)
        },
        header: {
            ...commonStyles.bigText,
            maxWidth: sizeHelper.getActualSizeW(isPad ? 430 : 280)
        },
        mobileScreen: {
            height: sizeHelper.getActualSizeH(379),
            aspectRatio: 468 / 758,
            marginBottom: sizeHelper.getActualSizeH(9.5),
            marginTop: sizeHelper.getActualSizeH(10)
        }
    },
    done: {
        mainContainer: {
            ...commonStyles.mainContainer,
            alignItems: 'center',
            backgroundColor: undefined,
            paddingHorizontal: undefined,
            paddingTop: sizeHelper.getActualSizeH(isPad ? 289 : 102) },
        header: {
            ...commonStyles.bigText,
            color: WHITE_COLOR,
            marginTop: sizeHelper.getActualSizeH(isPad ? 40 : 96),
            marginBottom: sizeHelper.getActualSizeH(30),
            fontSize: sizeHelper.getActualFontSize(24)
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
            paddingTop: sizeHelper.getActualSizeH(isPad ? 80 : 34) },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer,
            paddingTop: sizeHelper.getActualSizeH(isPad ? undefined : 25),
            height: sizeHelper.getActualSizeH(isPad ? 100 : 123),
            marginBottom: sizeHelper.getActualSizeH(isPad ? 41 : 25)
        },
        regularText: {
            ...commonStyles.regularText,
            marginBottom: sizeHelper.getActualSizeH(28),
            fontSize: sizeHelper.getActualFontSize(isPad ? 18 : 17),
            maxWidth: sizeHelper.getActualSizeW(600)
        },
        boldText: {
            fontWeight: 'bold'
        },
        header: {
            ...commonStyles.bigText,
            fontSize: sizeHelper.getActualFontSize(isPad ? 28 : 26)
        },
        mobileScreen: {
            height: sizeHelper.getActualSizeH(180),
            aspectRatio: 810 / 540,
            marginBottom: sizeHelper.getActualSizeH(isPad ? 23 : 9.5),
            marginTop: sizeHelper.getActualSizeH(isPad ? 50 : 10)
        }
    },
    staff: {
        mainContainer: {
            ...commonStyles.mainContainer,
            height: isPad ? sizeHelper.getActualSizeH(1015) : undefined,
            paddingHorizontal: sizeHelper.getActualSizeW(26)
        },
        innerUpperContainer: {
            ...commonStyles.innerUpperContainer,
            height: sizeHelper.getActualSizeH(isPad ? 835 : 668),
            paddingTop: sizeHelper.getActualSizeH(isPad ? 150 : 34) },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer,
            justifyContent: isPad ? 'center' : 'flex-end',
            height: sizeHelper.getActualSizeH(isPad ? 180 : 148),
            paddingBottom: sizeHelper.getActualSizeH(25)
        },
        lightText: {
            ...JaneWeb.regularFont,
            color: DARK_TEXT_COLOR,
            width: '100%',
            textAlign: 'left',
            marginVertical: sizeHelper.getActualSizeH(isPad ? 15 : 9),
            fontSize: sizeHelper.getActualFontSize(18),
            maxWidth: sizeHelper.getActualSizeW(371)
        },
        boldText: {
            fontWeight: 'bold'
        },
        mobileScreen: {
            height: sizeHelper.getActualSizeH(418),
            aspectRatio: 717 / 1257,
            marginBottom: sizeHelper.getActualSizeH(9.5),
            marginTop: sizeHelper.getActualSizeH(isPad ? 44 : 10)
        }
    }
};

const tutorialStyles = { ...commonStyles,
    ...stepsScreenStyles };

export default tutorialStyles;
