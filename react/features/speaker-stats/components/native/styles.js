import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export default {
    speakerStatsContainer: {
        flexDirection: 'column',
        flex: 1,
        height: 'auto'
    },
    speakerStatsItemContainer: {
        flexDirection: 'row',
        alignSelf: 'stretch',
        height: 24
    },
    speakerStatsItemStatus: {
        flex: 1,
        alignSelf: 'stretch'
    },
    speakerStatsItemStatusDot: {
        width: 5,
        height: 5,
        marginLeft: 7,
        marginTop: 8,
        padding: 3,
        borderRadius: 10,
        borderWidth: 0
    },
    speakerStatsItemName: {
        flex: 8,
        alignSelf: 'stretch'
    },
    speakerStatsItemTime: {
        flex: 12,
        alignSelf: 'stretch'
    },
    speakerStatsLabelContainer: {
        marginTop: BaseTheme.spacing[2],
        marginBottom: BaseTheme.spacing[1],
        flexDirection: 'row'
    },
    dummyElement: {
        flex: 1,
        alignSelf: 'stretch'
    },
    speakerName: {
        flex: 8,
        alignSelf: 'stretch'
    },
    speakerTime: {
        flex: 12,
        alignSelf: 'stretch'
    }


};
