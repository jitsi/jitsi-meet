import BaseTheme from '../../base/ui/components/BaseTheme.native';
const SECONDARY_COLOR = BaseTheme.palette.border04;


export default {
    button: {
        alignItems: 'center',
        borderRadius: BaseTheme.shape.borderRadius,
        padding: BaseTheme.spacing[2],
        height: BaseTheme.spacing[7],
        width: '100%'
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
        backgroundColor: BaseTheme.palette.ui02,
        flex: 1,
        flexDirection: 'row'
    },

    largeVideoContainer: {
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '50%'
    },

    largeVideoContainerWide: {
        height: '100%',
        width: '50%'
    },

    contentContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },

    contentContainerWide: {
        justifyContent: 'center',
        marginHorizontal: BaseTheme.spacing[2],
        width: '50%'
    },

    toolboxContainer: {
        alignItems: 'center',
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
        alignSelf: 'stretch'
    },

    field: {
        backgroundColor: BaseTheme.palette.field02,
        borderColor: SECONDARY_COLOR,
        borderRadius: BaseTheme.shape.borderRadius,
        borderWidth: 2,
        height: BaseTheme.spacing[7],
        marginHorizontal: BaseTheme.spacing[3],
        padding: BaseTheme.spacing[2]
    }
};
