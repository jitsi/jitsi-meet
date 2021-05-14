import BaseTheme from '../../../base/ui/components/BaseTheme.native';

/**
 * The styles of the native components of the feature {@code participants}.
 */
export default {
    participantsPane: {
        backgroundColor: BaseTheme.palette.ui01,
        padding: 16
    },

    closeButton: {
        alignItems: 'center',
        display: 'flex',
        height: 48,
        justifyContent: 'center',
        marginLeft: 'auto'
    },

    closeIcon: {
        display: 'flex',
        flex: 1,
        fontSize: 24,
        justifyContent: 'center'
    }
};
