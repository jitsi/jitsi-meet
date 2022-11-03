import BaseTheme from '../../../ui/components/BaseTheme.native';

const BUTTON_HEIGHT = BaseTheme.spacing[7];

const button = {
    borderRadius: BaseTheme.shape.borderRadius,
    display: 'flex',
    height: BUTTON_HEIGHT,
    justifyContent: 'center'
};

const buttonLabel = {
    ...BaseTheme.typography.bodyShortBold,
    textTransform: 'capitalize'
};

export default {
    button: {
        ...button
    },

    buttonLabel: {
        ...buttonLabel
    },

    buttonContent: {
        height: BUTTON_HEIGHT
    },

    buttonLabelDisabled: {
        ...buttonLabel,
        color: BaseTheme.palette.text03
    },

    buttonDisabled: {
        ...button,
        backgroundColor: BaseTheme.palette.actionDisabled
    },

    buttonLabelPrimary: {
        ...buttonLabel,
        color: BaseTheme.palette.text01
    },

    buttonLabelSecondary: {
        ...buttonLabel,
        color: BaseTheme.palette.text04
    },

    buttonLabelDestructive: {
        ...buttonLabel,
        color: BaseTheme.palette.text01
    },

    buttonLabelTertiary: {
        ...buttonLabel,
        color: BaseTheme.palette.text01
    }
};
