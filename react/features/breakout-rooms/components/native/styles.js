import BaseTheme from '../../../base/ui/components/BaseTheme.native';

const baseButton = {
    height: BaseTheme.spacing[6],
    marginTop: BaseTheme.spacing[2],
    marginLeft: BaseTheme.spacing[3],
    marginRight: BaseTheme.spacing[3]
};

const baseLabel = {
    fontSize: 15,
    lineHeight: 24,
    textTransform: 'capitalize'
};

/**
 * The styles of the native components of the feature {@code breakout rooms}.
 */
export default {

    addButtonLabel: {
        ...baseLabel,
        color: BaseTheme.palette.text01
    },

    addButton: {
        ...baseButton,
        backgroundColor: BaseTheme.palette.ui03
    },

    collapsibleRoom: {
        ...baseButton,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center'
    },

    arrowIcon: {
        backgroundColor: BaseTheme.palette.ui03,
        height: BaseTheme.spacing[5],
        width: BaseTheme.spacing[5],
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },

    roomName: {
        fontSize: 15,
        color: BaseTheme.palette.text01,
        fontWeight: 'bold',
        marginLeft: BaseTheme.spacing[2]
    },

    transparentButton: {
        ...baseButton,
        backgroundColor: 'transparent'
    },

    leaveButtonLabel: {
        ...baseLabel,
        color: BaseTheme.palette.textError
    },

    autoAssignLabel: {
        ...baseLabel,
        color: BaseTheme.palette.link01
    }
};
