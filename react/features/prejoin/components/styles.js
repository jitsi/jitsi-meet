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
        flex: 1
    },

    contentWide: {
        flex: 1,
        flexDirection: 'row'
    },

    largeVideoContainer: {
        alignItems: 'center',
        display: 'flex',
        justifyContent: 'center',
        height: '50%'
    },

    largeVideoContainerWide: {
        width: '50%'
    },

    contentContainer: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui02,
        height: '50%',
        display: 'flex',
        justifyContent: 'center'
    },

    contentContainerWide: {
        backgroundColor: BaseTheme.palette.ui02,
        justifyContent: 'center',
        width: '50%'
    },

    toolboxContainer: {
        alignSelf: 'center',
        display: 'flex',
        flexDirection: 'row',
        flex: 0.8,
        justifyContent: 'center',
        marginTop: BaseTheme.spacing[2]
    },

    toolboxContainerWide: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: BaseTheme.spacing[2]
    },

    formWrapper: {
        alignSelf: 'stretch',
        justifyContent: 'center',
        margin: BaseTheme.spacing[3]
    },

    field: {
        backgroundColor: BaseTheme.palette.field02,
        borderColor: SECONDARY_COLOR,
        borderRadius: BaseTheme.shape.borderRadius,
        borderWidth: 2,
        height: BaseTheme.spacing[7],
        textAlign: 'center'
    },

    deviceStatusError: {
        alignItems: 'flex-start',
        backgroundColor: BaseTheme.palette.warning01,
        borderRadius: 6,
        color: BaseTheme.palette.uiBackground,
        padding: 16,
        textAlign: 'left'
    },

    statusMessage: {
        backgroundColor: 'red',
        marginLeft: BaseTheme.spacing[3]
    },

    deviceStatus: {
        alignItems: 'center',
        color: '#fff',
        display: 'flex',
        fontSize: 14,
        lineHeight: 20,
        padding: 6,
        textAlign: 'center'
    }
};
