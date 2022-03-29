// @flow
import { StyleSheet, Platform } from 'react-native';

import {
    ColorPalette, isIPhoneX,
    JaneWeb,
    sizeHelper
} from '../../../base/styles';


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
        paddingHorizontal: sizeHelper.getDpByWidth(23),
        width: '100%',
        paddingBottom: isPad || isIPhoneX() ? 0 : 10
    },
    bigText: {
        ...JaneWeb.boldFont,
        textAlign: 'center',
        color: DARK_TEXT_COLOR,
        marginBottom: sizeHelper.getDpByHeight(20),
        fontSize: sizeHelper.getDpByHeight(28)
    },
    regularText: {
        ...JaneWeb.mediumFont,
        color: DARK_TEXT_COLOR,
        textAlign: 'left',
        marginVertical: sizeHelper.getDpByHeight(28),
        fontSize: sizeHelper.getDpByHeight(18)
    },
    logo: {
        backgroundColor: JANE_COLOR,
        height: undefined,
        aspectRatio: 1437 / 1188,
        width: sizeHelper.getDpByHeight(204)
    },
    logoBlue: {
        height: undefined,
        aspectRatio: 450 / 370,
        width: sizeHelper.getDpByHeight(204)
    },
    mainContainer: {
        height: sizeHelper.getDpByHeight(UPPER_SECTION_HEIGHT),
        backgroundColor: INNER_CONTAINER_BACKGROUND,
        borderRadius: 6,
        paddingHorizontal: sizeHelper.getDpByWidth(25) },
    fullIphoneScreenContainer: {
        height: isPad ? sizeHelper.getDpByHeight(UPPER_SECTION_HEIGHT) : undefined,
        flex: isPad ? 0 : 1
    },
    innerUpperContainer: {
        width: '100%',
        alignItems: 'center',
        height: sizeHelper.getDpByHeight(INNER_UPPER_CONTAINER_HEIGHT) },
    innerLowerContainer: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        paddingBottom: sizeHelper.getDpByHeight(isPad ? 41 : 25)
    },
    buttonContainer: {
        height: sizeHelper.getDpByHeight(LOWER_SECTION_HEIGHT),
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center' }
};

const stepsScreenStyles = {
    stepOne: {
        mainContainer: {
            ...commonStyles.mainContainer,
            paddingTop: sizeHelper.getDpByHeight(isPad ? 244 : 64) },
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
            maxWidth: isPad ? sizeHelper.getDpByWidth(300) : undefined
        },
        header: {
            ...commonStyles.bigText,
            maxWidth: isPad ? undefined : sizeHelper.getDpByWidth(240),
            marginBottom: sizeHelper.getDpByHeight(isPad ? 66 : 20)
        },
        logo: {
            ...commonStyles.logoBlue,
            marginBottom: sizeHelper.getDpByHeight(isPad ? 26 : 57)
        }
    },
    stepTwo: {
        mainContainer: {
            ...commonStyles.mainContainer,
            ...commonStyles.fullIphoneScreenContainer
        },
        innerUpperContainer: {
            ...commonStyles.innerUpperContainer,
            paddingTop: sizeHelper.getDpByHeight(64) },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer
        },
        header: {
            ...commonStyles.bigText,
            maxWidth: sizeHelper.getDpByWidth(isPad ? 600 : 293),
            marginBottom: sizeHelper.getDpByWidth(isPad ? 30 : 22)
        },
        logo: {
            ...commonStyles.logoBlue,
            marginBottom: sizeHelper.getDpByHeight(57)
        }
    },
    stepThree: {
        mainContainer: {
            ...commonStyles.mainContainer,
            ...commonStyles.fullIphoneScreenContainer
        },
        header: {
            ...commonStyles.bigText,
            marginTop: sizeHelper.getDpByHeight(isPad ? 101 : 51),
            marginBottom: sizeHelper.getDpByHeight(30),
            maxWidth: sizeHelper.getDpByWidth(450)
        },
        innerUpperContainer: {
            ...commonStyles.innerUpperContainer,
            paddingTop: sizeHelper.getDpByHeight(isPad ? 138 : 64) },
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
            paddingTop: sizeHelper.getDpByHeight(isPad ? 80 : 34) },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer,
            justifyContent: 'flex-end'
        },
        message: {
            ...commonStyles.regularText,
            textAlign: 'left',
            maxWidth: sizeHelper.getDpByWidth(320),
            fontSize: sizeHelper.getDpByHeight(17)
        },
        header: {
            ...commonStyles.bigText,
            maxWidth: sizeHelper.getDpByWidth(isPad ? 430 : 280)
        },
        mobileScreen: {
            height: sizeHelper.getDpByHeight(379),
            aspectRatio: 468 / 758,
            marginBottom: sizeHelper.getDpByHeight(isPad ? 0 : 9.5),
            marginTop: sizeHelper.getDpByHeight(isPad ? 0 : 7)
        }
    },
    done: {
        mainContainer: {
            ...commonStyles.mainContainer,
            alignItems: 'center',
            backgroundColor: undefined,
            paddingHorizontal: undefined,
            paddingTop: sizeHelper.getDpByHeight(isPad ? 289 : 102) },
        header: {
            ...commonStyles.bigText,
            color: WHITE_COLOR,
            marginTop: sizeHelper.getDpByHeight(isPad ? 40 : 96),
            marginBottom: sizeHelper.getDpByHeight(30),
            fontSize: sizeHelper.getDpByHeight(24)
        }
    },
    noEmail: {
        mainContainer: {
            ...commonStyles.mainContainer,
            ...commonStyles.fullIphoneScreenContainer
        },
        innerUpperContainer: {
            ...commonStyles.innerUpperContainer,
            paddingTop: sizeHelper.getDpByHeight(isPad ? 80 : 34) },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer,
            paddingTop: sizeHelper.getDpByHeight(isPad ? undefined : 25)
        },
        regularText: {
            ...commonStyles.regularText,
            marginVertical: undefined,
            fontSize: sizeHelper.getDpByHeight(isPad ? 18 : 16),
            maxWidth: sizeHelper.getDpByWidth(isPad ? 600 : 280)
        },
        boldText: {
            fontWeight: 'bold'
        },
        header: {
            ...commonStyles.bigText,
            fontSize: sizeHelper.getDpByHeight(isPad ? 28 : 26)
        },
        mobileScreen: {
            height: sizeHelper.getDpByHeight(180),
            aspectRatio: 810 / 540,
            marginBottom: sizeHelper.getDpByHeight(isPad ? 23 : 25),
            marginTop: sizeHelper.getDpByHeight(isPad ? 50 : 10)
        }
    },
    staff: {
        mainContainer: {
            ...commonStyles.mainContainer,
            ...commonStyles.fullIphoneScreenContainer,
            height: isPad ? sizeHelper.getDpByHeight(1015) : undefined,
            paddingHorizontal: sizeHelper.getDpByWidth(26)
        },
        innerUpperContainer: {
            ...commonStyles.innerUpperContainer,
            height: sizeHelper.getDpByHeight(isPad ? 855 : 718),
            paddingTop: sizeHelper.getDpByHeight(isPad ? 50 : 34) },
        innerLowerContainer: {
            ...commonStyles.innerLowerContainer,
            justifyContent: isPad ? 'center' : 'flex-end',
            paddingBottom: sizeHelper.getDpByHeight(isPad ? undefined : 25)
        },
        title: {
            ...commonStyles.bigText,
            marginBottom: sizeHelper.getDpByHeight(5)
        },
        steps: {
            container: {
                flexDirection: 'row',
                maxWidth: sizeHelper.getDpByWidth(371)
            },
            number: {
                width: sizeHelper.getDpByHeight(20)
            },
            text: {
                flex: 1
            }
        },
        lightText: {
            ...JaneWeb.regularFont,
            color: DARK_TEXT_COLOR,
            width: '100%',
            textAlign: 'left',
            marginVertical: sizeHelper.getDpByHeight(isPad ? 15 : 9),
            fontSize: sizeHelper.getDpByHeight(18),
            maxWidth: sizeHelper.getDpByWidth(371)
        },
        boldText: {
            fontWeight: 'bold'
        },
        mobileScreen: {
            flex: 1,
            aspectRatio: 717 / 1257,
            marginTop: sizeHelper.getDpByHeight(10)
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
