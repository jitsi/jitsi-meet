import BaseTheme from '../../../ui/components/BaseTheme.native';

const BUTTON_HEIGHT = BaseTheme.spacing[7];

const button = {
    borderRadius: BaseTheme.shape.borderRadius,
    display: 'flex',
    height: BUTTON_HEIGHT,
    justifyContent: 'center'
};

const buttonLabel = {
    ...BaseTheme.typography.bodyShortBold
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
    }
};
