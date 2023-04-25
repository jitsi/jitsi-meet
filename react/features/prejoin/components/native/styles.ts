import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export const preJoinStyles = {

    joinButton: {
        marginTop: BaseTheme.spacing[3],
        width: 352
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
        height: '60%'
    },

    largeVideoContainerWide: {
        height: '100%',
        marginRight: 'auto',
        position: 'absolute',
        width: '50%'
    },

    contentContainer: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.uiBackground,
        bottom: 0,
        display: 'flex',
        height: 280,
        justifyContent: 'center',
        position: 'absolute',
        width: '100%',
        zIndex: 1
    },

    contentContainerWide: {
        alignItems: 'center',
        height: '100%',
        justifyContent: 'center',
        left: '50%',
        padding: BaseTheme.spacing[3],
        position: 'absolute',
        width: '50%'
    },

    toolboxContainer: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui01,
        borderRadius: BaseTheme.shape.borderRadius,
        display: 'flex',
        flexDirection: 'row',
        height: 60,
        justifyContent: 'space-between',
        marginBottom: BaseTheme.spacing[3],
        paddingHorizontal: BaseTheme.spacing[2],
        width: 148
    },

    customInput: {
        textAlign: 'center',
        width: 352
    },

    preJoinRoomName: {
        ...BaseTheme.typography.heading5,
        color: BaseTheme.palette.text01,
        textAlign: 'center'
    },

    displayRoomNameBackdrop: {
        alignSelf: 'center',
        backgroundColor: BaseTheme.palette.uiBackground,
        borderRadius: BaseTheme.shape.borderRadius,
        marginTop: BaseTheme.spacing[3],
        opacity: 0.7,
        paddingHorizontal: BaseTheme.spacing[3],
        paddingVertical: BaseTheme.spacing[1],
        position: 'absolute',
        width: 243,
        zIndex: 1
    }
};
