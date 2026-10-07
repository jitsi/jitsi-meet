import BaseTheme from '../../../base/ui/components/BaseTheme.native';

/**
 * The styles of the welcome page system-wide user notification.
 */
export default {
    button: {
        alignSelf: 'flex-start',
        marginTop: BaseTheme.spacing[1]
    },

    container: {
        backgroundColor: BaseTheme.palette.ui02,
        borderLeftColor: BaseTheme.palette.action01,
        borderLeftWidth: 4,
        borderRadius: BaseTheme.shape.borderRadius,
        marginTop: BaseTheme.spacing[3],
        paddingHorizontal: BaseTheme.spacing[3],
        paddingVertical: BaseTheme.spacing[2]
    },

    description: {
        ...BaseTheme.typography.bodyShortRegular,
        color: BaseTheme.palette.text01,
        marginTop: BaseTheme.spacing[1]
    },

    title: {
        ...BaseTheme.typography.heading6,
        color: BaseTheme.palette.text01
    }
};
