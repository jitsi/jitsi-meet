import BaseTheme from '../../base/ui/components/BaseTheme.native';

const SECONDARY_COLOR = BaseTheme.palette.border04;

export default {
    joinButton: {
        marginVertical: BaseTheme.spacing[3]
    },

    buttonStylesBorderless: {
        iconStyle: {
            color: BaseTheme.palette.icon01,
            fontSize: 24
        },
        style: {
            flexDirection: 'row',
            justifyContent: 'center',
            margin: BaseTheme.spacing[3],
            height: 24,
            width: 24
        },
        underlayColor: 'transparent'
    },

    contentWrapper: {
        flex: 1
    },

    contentWrapperWide: {
        flex: 1,
        flexDirection: 'row'
    },

    largeVideoContainer: {
        minHeight: '60%'
    },

    largeVideoContainerWide: {
        height: '100%',
        marginRight: 'auto',
        position: 'absolute',
        width: '60%'
    },

    contentContainer: {
        alignSelf: 'center',
        display: 'flex',
        justifyContent: 'center',
        minHeight: '40%',
        padding: BaseTheme.spacing[3],
        width: 400
    },

    contentContainerWide: {
        alignSelf: 'center',
        height: '100%',
        justifyContent: 'center',
        left: '60%',
        padding: BaseTheme.spacing[3],
        position: 'absolute',
        width: '40%'
    },

    toolboxContainer: {
        alignSelf: 'center',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center'
    },

    toolboxContainerWide: {
        flexDirection: 'row',
        justifyContent: 'center'
    },

    formWrapper: {
        alignSelf: 'stretch',
        justifyContent: 'center',
        marginHorizontal: BaseTheme.spacing[3]
    },

    field: {
        backgroundColor: BaseTheme.palette.field02,
        borderColor: SECONDARY_COLOR,
        borderRadius: BaseTheme.shape.borderRadius,
        borderWidth: 2,
        color: BaseTheme.palette.text06,
        height: BaseTheme.spacing[7],
        textAlign: 'center'
    },

    preJoinRoomName: {
        ...BaseTheme.typography.heading5,
        color: BaseTheme.palette.text01,
        textAlign: 'center'
    },

    displayRoomNameBackdrop: {
        alignSelf: 'center',
        backgroundColor: BaseTheme.palette.ui16,
        bottom: BaseTheme.spacing[3],
        borderRadius: 4,
        margin: BaseTheme.spacing[3],
        paddingHorizontal: BaseTheme.spacing[3],
        paddingVertical: BaseTheme.spacing[1],
        position: 'absolute'
    }
};
