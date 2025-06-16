import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export default {

    customContainer: {
        marginVertical: BaseTheme.spacing[2]
    },

    speakerStatsContainer: {
        flexDirection: 'column',
        flex: 1,
        height: 'auto',
        paddingHorizontal: BaseTheme.spacing[3],
        backgroundColor: BaseTheme.palette.ui01
    },

    speakerStatsItemContainer: {
        flexDirection: 'row',
        alignSelf: 'stretch',
        height: BaseTheme.spacing[9],
        alignItems: 'center'
    },

    speakerStatsAvatar: {
        width: BaseTheme.spacing[5],
        height: BaseTheme.spacing[5],
        marginRight: BaseTheme.spacing[3]
    },

    speakerStatsNameTime: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center'
    },

    speakerStatsText: {
        ...BaseTheme.typography.bodyShortRegularLarge,
        color: BaseTheme.palette.text01
    },

    speakerStatsTime: {
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4
    },

    speakerStatsDominant: {
        backgroundColor: BaseTheme.palette.success02
    },

    speakerStatsLeft: {
        color: BaseTheme.palette.text03
    }
};
