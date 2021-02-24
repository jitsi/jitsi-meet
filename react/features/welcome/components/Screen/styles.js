// @flow
import {
    ColorPalette, isIPhoneX,
    JaneWeb,
    sizeHelper
} from '../../../base/styles';
import { StyleSheet, Platform } from 'react-native';

const isPad = Platform.isPad;
const WHITE_COLOR = ColorPalette.white;
const JANE_COLOR = ColorPalette.jane;
const DARK_TEXT_COLOR = ColorPalette.janeDarkGrey;
const INNER_CONTAINER_BACKGROUND = ColorPalette.janeLight;

// Numbers below are from design mock up.
const UPPER_SECTION_HEIGHT = isPad ? 866 : 746;
const LOWER_SECTION_HEIGHT = isPad ? 184 : 98;
const INNER_UPPER_CONTAINER_HEIGHT = isPad ? 722 : 668;

const commonStyles = {
    blankPageWrapper: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: JANE_COLOR
    },
    wrapper: {
        flex: 1,
        paddingHorizontal: sizeHelper.getActualSizeW(23),
        width: '100%',
        paddingBottom: isPad || isIPhoneX() ? 0 : 10
    },
    bigText: {
        ...JaneWeb.boldFont,
        textAlign: 'center',
        color: DARK_TEXT_COLOR,
        marginBottom: sizeHelper.getActualSizeH(20),
        fontSize: sizeHelper.getActualSizeH(28)
    },
    regularText: {
        ...JaneWeb.mediumFont,
        color: DARK_TEXT_COLOR,
        textAlign: 'left',
        marginVertical: sizeHelper.getActualSizeH(28),
        fontSize: sizeHelper.getActualSizeH(18)
    },
    logo: {
        backgroundColor: JANE_COLOR,
        height: undefined,
        aspectRatio: 1437 / 1188,
        width: sizeHelper.getActualSizeH(204)
    },
    logoBlue: {
        height: undefined,
        aspectRatio: 450 / 370,
        width: sizeHelper.getActualSizeH(204)
    },
    mainContainer: {
        height: sizeHelper.getActualSizeH(UPPER_SECTION_HEIGHT),
        backgroundColor: INNER_CONTAINER_BACKGROUND,
        borderRadius: 6,
        paddingHorizontal: sizeHelper.getActualSizeW(25) },
    fullIphoneScreenContainer: {
        height: isPad ? sizeHelper.getActualSizeH(UPPER_SECTION_HEIGHT) : undefined,
        flex: isPad ? 0 : 1
    },
    innerUpperContainer: {
        width: '100%',
        alignItems: 'center',
        height: sizeHelper.getActualSizeH(INNER_UPPER_CONTAINER_HEIGHT) },
    innerLowerContainer: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingBottom: sizeHelper.getActualSizeH(isPad ? 41 : 25)
    },
    buttonContainer: {
        height: sizeHelper.getActualSizeH(LOWER_SECTION_HEIGHT),
        borderRadius: 6,
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
            alignItems: 'center'
        },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer,
            justifyContent: 'flex-end'
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
            ...commonStyles.innerLowerContainer
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
            justifyContent: 'flex-end'
        }
    },
    stepFour: {
        mainContainer: {
            ...commonStyles.mainContainer,
            ...commonStyles.fullIphoneScreenContainer
        },
        innerUpperContainer: {
            ...commonStyles.innerUpperContainer,
            paddingTop: sizeHelper.getActualSizeH(isPad ? 80 : 34) },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer,
            justifyContent: 'flex-end'
        },
        message: {
            ...commonStyles.regularText,
            textAlign: 'left',
            maxWidth: sizeHelper.getActualSizeW(320),
            fontSize: sizeHelper.getActualSizeH(17)
        },
        header: {
            ...commonStyles.bigText,
            maxWidth: sizeHelper.getActualSizeW(isPad ? 430 : 280)
        },
        mobileScreen: {
            height: sizeHelper.getActualSizeH(379),
            aspectRatio: 468 / 758,
            marginBottom: sizeHelper.getActualSizeH(isPad ? 0 : 9.5),
            marginTop: sizeHelper.getActualSizeH(isPad ? 0 : 7)
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
            fontSize: sizeHelper.getActualSizeH(24)
        }
    },
    noEmail: {
        mainContainer: {
            ...commonStyles.mainContainer,
            ...commonStyles.fullIphoneScreenContainer
        },
        innerUpperContainer: {
            ...commonStyles.innerUpperContainer,
            paddingTop: sizeHelper.getActualSizeH(isPad ? 80 : 34) },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer,
            paddingTop: sizeHelper.getActualSizeH(isPad ? undefined : 25)
        },
        regularText: {
            ...commonStyles.regularText,
            marginVertical: undefined,
            fontSize: sizeHelper.getActualSizeH(isPad ? 18 : 16),
            maxWidth: sizeHelper.getActualSizeW(isPad ? 600 : 280)
        },
        boldText: {
            fontWeight: 'bold'
        },
        header: {
            ...commonStyles.bigText,
            fontSize: sizeHelper.getActualSizeH(isPad ? 28 : 26)
        },
        mobileScreen: {
            height: sizeHelper.getActualSizeH(180),
            aspectRatio: 810 / 540,
            marginBottom: sizeHelper.getActualSizeH(isPad ? 23 : 25),
            marginTop: sizeHelper.getActualSizeH(isPad ? 50 : 10)
        }
    },
    staff: {
        mainContainer: {
            ...commonStyles.mainContainer,
            ...commonStyles.fullIphoneScreenContainer,
            height: isPad ? sizeHelper.getActualSizeH(1015) : undefined,
            paddingHorizontal: sizeHelper.getActualSizeW(26)
        },
        innerUpperContainer: {
            ...commonStyles.innerUpperContainer,
            height: sizeHelper.getActualSizeH(isPad ? 835 : INNER_UPPER_CONTAINER_HEIGHT),
            paddingTop: sizeHelper.getActualSizeH(isPad ? 150 : 34) },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer,
            justifyContent: isPad ? 'center' : 'flex-end',
            paddingBottom: sizeHelper.getActualSizeH(isPad ? undefined : 25)
        },
        lightText: {
            ...JaneWeb.regularFont,
            color: DARK_TEXT_COLOR,
            width: '100%',
            textAlign: 'left',
            marginVertical: sizeHelper.getActualSizeH(isPad ? 15 : 9),
            fontSize: sizeHelper.getActualSizeH(18),
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
    },
    default: {
        mainContainer: {
            ...commonStyles.fullIphoneScreenContainer,
            justifyContent: 'center',
            alignItems: 'center'
        }
    }
};

const tutorialStyles = { ...commonStyles,
    ...stepsScreenStyles };

export default tutorialStyles;
