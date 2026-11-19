import BaseTheme from '../../base/ui/components/BaseTheme.native';

export default {
    dialog: {
        marginBottom: BaseTheme.spacing[2]
    },

    rating: {
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        marginVertical: BaseTheme.spacing[3]
    },

    ratingLabel: {
        ...BaseTheme.typography.bodyShortBold,
        color: BaseTheme.palette.text01,
        marginBottom: BaseTheme.spacing[2],
        minHeight: 20,
        textAlign: 'center' as const
    },

    stars: {
        alignItems: 'center' as const,
        flexDirection: 'row' as const,
        justifyContent: 'center' as const
    },

    starBtn: {
        padding: BaseTheme.spacing[1],
        marginHorizontal: BaseTheme.spacing[1]
    }
};

