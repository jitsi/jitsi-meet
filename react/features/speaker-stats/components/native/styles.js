import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export default {
    speakerStatsContainer: {
        flexDirection: 'column',
        flex: 1,
        height: 'auto',
        paddingHorizontal: 16,
        backgroundColor: BaseTheme.palette.ui02
    },
    speakerStatsItemContainer: {
        flexDirection: 'row',
        alignSelf: 'stretch',
        height: 64,
        alignItems: 'center'
    },
    speakerStatsAvatar: {
        width: 32,
        height: 32,
        marginRight: 16
    },
    speakerStatsNameTime: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    speakerStatsText: {
        fontSize: 16,
        fontWeight: '400',
        color: BaseTheme.palette.text01
    },
    speakerStatsTime: {
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4
    },
    speakerStatsDominant: {
        backgroundColor: BaseTheme.palette.success02
    }


};
