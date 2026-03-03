import BaseTheme from '../../../ui/components/BaseTheme.native';
import { BUTTON_TYPES } from '../../constants.native';

const BUTTON_HEIGHT = BaseTheme.spacing[7];

const button = {
    borderRadius: BUTTON_HEIGHT / 2.0,
    display: 'flex',
    height: BUTTON_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12
};

const buttonLabel = {
    ...BaseTheme.typography.bodyShortBold
};

const pillButtonLabel = {
    ...buttonLabel,
    textTransform: 'capitalize',
    color: BaseTheme.palette.fishMeetText01
};

export default {
    button: {
        ...button
    },

    buttonLabel: {
        ...buttonLabel
    },

    buttonLabelDisabled: {
        ...buttonLabel,
        color: BaseTheme.palette.text03
    },

    buttonContent: {
        height: BUTTON_HEIGHT
    },

    buttonDisabled: {
        ...button,
        backgroundColor: BaseTheme.palette.ui08
    },

    buttonLabelPrimary: {
        ...buttonLabel,
        color: BaseTheme.palette.text01
    },

    buttonLabelPrimaryText: {
        ...buttonLabel,
        color: BaseTheme.palette.action01
    },

    buttonLabelSecondary: {
        ...buttonLabel,
        color: BaseTheme.palette.text04
    },

    buttonLabelDestructive: {
        ...buttonLabel,
        color: BaseTheme.palette.text01
    },

    buttonLabelDestructiveText: {
        ...buttonLabel,
        color: BaseTheme.palette.actionDanger
    },

    buttonLabelTertiary: {
        ...buttonLabel,
        color: BaseTheme.palette.text01,
        marginHorizontal: BaseTheme.spacing[2],
        textAlign: 'center'
    },

    buttonLabelTertiaryDisabled: {
        ...buttonLabel,
        color: BaseTheme.palette.text03,
        textAlign: 'center'
    },

    // per-type config: label style and background color for NativePaperButton
    buttonTypeConfig: {
        [BUTTON_TYPES.PRIMARY]: {
            color: BaseTheme.palette.fishMeetMainColor01,
            labelStyle: pillButtonLabel
        },
        [BUTTON_TYPES.SECONDARY]: {
            color: BaseTheme.palette.fishMeetAction01,
            labelStyle: pillButtonLabel
        },
        [BUTTON_TYPES.TERTIARY]: {
            color: BaseTheme.palette.fishMeetMainColor02,
            labelStyle: pillButtonLabel
        },
        [BUTTON_TYPES.DESTRUCTIVE]: {
            color: BaseTheme.palette.actionDanger,
            labelStyle: pillButtonLabel
        }
    }
};
