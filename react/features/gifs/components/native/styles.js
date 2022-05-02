import BaseTheme from '../../../base/ui/components/BaseTheme.native';

export default {
    container: {
        backgroundColor: BaseTheme.palette.ui01,
        flex: 1
    },

    clearableInput: {
        wrapper: {
            marginBottom: BaseTheme.spacing[3],
            marginTop: BaseTheme.spacing[3]
        },

        input: { textAlign: 'left' }
    },

    grid: {
        flex: 1,
        marginLeft: BaseTheme.spacing[3],
        marginRight: BaseTheme.spacing[3]
    },

    credit: {
        backgroundColor: BaseTheme.palette.ui01,
        width: '100%',
        height: 40,
        position: 'absolute',
        marginBottom: 0,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },

    creditText: {
        color: 'white',
        fontWeight: 'bold'
    }
};
