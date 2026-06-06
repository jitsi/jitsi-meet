import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export default {
    container: {
        backgroundColor: BaseTheme.palette.ui01,
        flex: 1
    },

    customContainer: {
        marginHorizontal: BaseTheme.spacing[3],
        marginVertical: BaseTheme.spacing[2]
    },

    grid: {
        flex: 1,
        marginLeft: BaseTheme.spacing[3],
        marginRight: BaseTheme.spacing[3]
    },

    credit: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.ui01,
        display: 'flex',
        flexDirection: 'row',
        height: 56,
        justifyContent: 'center',
        width: '100%'
    },

    creditText: {
        color: BaseTheme.palette.text01,
        fontWeight: 'bold'
    }
};
