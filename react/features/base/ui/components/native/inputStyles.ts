// @ts-ignore
import BaseTheme from '../../../ui/components/BaseTheme.native';

export default {
    inputContainer: {
        display: 'flex',
        flexDirection: 'column'
    },

    label: {
        ...BaseTheme.typography.bodyShortRegularLarge,
        lineHeight: 0,
        color: BaseTheme.palette.text01,
        marginBottom: 8
    },

    fieldContainer: {
        position: 'relative'
    },

    icon: {
        position: 'absolute',
        zIndex: 1,
        top: 13,
        left: 16
    },

    input: {
        backgroundColor: BaseTheme.palette.ui03,
        color: BaseTheme.palette.text01,
        paddingVertical: 13,
        paddingHorizontal: BaseTheme.spacing[3],
        borderRadius: BaseTheme.shape.borderRadius,
        ...BaseTheme.typography.bodyShortRegularLarge,
        lineHeight: 0,
        height: 48,
        borderWidth: 2,
        borderColor: BaseTheme.palette.ui03
    },

    inputDisabled: {
        color: BaseTheme.palette.text03
    },

    inputFocused: {
        borderColor: BaseTheme.palette.focus01
    },

    inputError: {
        borderColor: BaseTheme.palette.textError
    },

    iconInput: {
        paddingLeft: BaseTheme.spacing[6]
    },

    clearableInput: {
        paddingRight: BaseTheme.spacing[6]
    },

    clearButton: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        position: 'absolute',
        right: 0,
        top: 13,
        width: 40,
        height: 48
    },

    clearIcon: {
        color: BaseTheme.palette.icon01
    }
};
