import BaseTheme from '../../base/ui/components/BaseTheme.native';

const SECONDARY_COLOR = BaseTheme.palette.border04;


export default {
    button: {
        alignItems: 'center',
        borderRadius: BaseTheme.shape.borderRadius,
        padding: BaseTheme.spacing[2],
        height: BaseTheme.spacing[7]
    },

    primaryButton: {
        backgroundColor: BaseTheme.palette.action01,
        marginTop: BaseTheme.spacing[4]
    },


    primaryButtonText: {
        ...BaseTheme.typography.labelButtonLarge,
        color: BaseTheme.palette.text01,
        lineHeight: 30
    },

    buttonStylesBorderless: {
        iconStyle: {
            backgroundColor: BaseTheme.palette.action02Active,
            color: BaseTheme.palette.icon01,
            fontSize: 24
        },
        style: {
            backgroundColor: BaseTheme.palette.action02Active,
            flexDirection: 'row',
            justifyContent: 'center',
            marginHorizontal: BaseTheme.spacing[3],
            height: 24,
            width: 24
        }
    },

    contentWrapper: {
        backgroundColor: BaseTheme.palette.ui02,
        flex: 1
    },

    contentWide: {
        flex: 1,
        flexDirection: 'row'
    },

    largeVideoContainer: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.uiBackground,
        display: 'flex',
        justifyContent: 'center',
        minHeight: '50%'
    },

    largeVideoContainerWide: {
        backgroundColor: BaseTheme.palette.uiBackground,
        display: 'flex',
        width: '50%'
    },

    contentContainer: {
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        padding: BaseTheme.spacing[3]
    },

    contentContainerWide: {
        justifyContent: 'center',
        padding: BaseTheme.spacing[3],
        width: '50%'
    },

    toolboxContainer: {
        alignSelf: 'center',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: BaseTheme.spacing[4]
    },

    toolboxContainerWide: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: BaseTheme.spacing[4]
    },

    formWrapper: {
        alignSelf: 'stretch',
        justifyContent: 'center'
    },

    field: {
        backgroundColor: BaseTheme.palette.field02,
        borderColor: SECONDARY_COLOR,
        borderRadius: BaseTheme.shape.borderRadius,
        borderWidth: 2,
        height: BaseTheme.spacing[7],
        marginTop: BaseTheme.spacing[2],
        textAlign: 'center'
    }
};
