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
        marginBottom: BaseTheme.spacing[2]
    },

    fieldContainer: {
        position: 'relative'
    },

    icon: {
        position: 'absolute',
        zIndex: 1,
        top: 14,
        left: 14
    },

    input: {
        ...BaseTheme.typography.bodyShortRegularLarge,
        backgroundColor: BaseTheme.palette.ui03,
        borderColor: BaseTheme.palette.ui03,
        borderRadius: BaseTheme.shape.borderRadius,
        borderWidth: 2,
        color: BaseTheme.palette.text01,
        paddingHorizontal: BaseTheme.spacing[3],
        height: BaseTheme.spacing[7],
        lineHeight: 20
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

    inputMultiline: {
        height: BaseTheme.spacing[10],
        paddingTop: BaseTheme.spacing[2]
    },

    clearableInput: {
        paddingRight: BaseTheme.spacing[6]
    },

    clearButton: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        position: 'absolute',
        right: 0,
        top: 14,
        width: BaseTheme.spacing[6],
        height: BaseTheme.spacing[7]
    },

    clearIcon: {
        color: BaseTheme.palette.icon01
    }
};
