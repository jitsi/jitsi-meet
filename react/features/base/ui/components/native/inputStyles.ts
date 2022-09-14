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
        ...BaseTheme.typography.bodyShortRegularLarge,
        backgroundColor: BaseTheme.palette.ui03,
        borderColor: BaseTheme.palette.ui03,
        borderRadius: BaseTheme.shape.borderRadius,
        borderWidth: 2,
        color: BaseTheme.palette.text01,
        paddingHorizontal: BaseTheme.spacing[3],
        height: 48
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
