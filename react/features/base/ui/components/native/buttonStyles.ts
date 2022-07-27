// @ts-ignore
import BaseTheme from '../../../ui/components/BaseTheme.native';

const BUTTON_HEIGHT = BaseTheme.spacing[7];

const button = {
    borderRadius: BaseTheme.shape.borderRadius,
    height: BUTTON_HEIGHT
};

const buttonLabel = {
    ...BaseTheme.typography.bodyShortBold,
    padding: 6,
    textTransform: 'capitalize'
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
        color: BaseTheme.palette.text0
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
