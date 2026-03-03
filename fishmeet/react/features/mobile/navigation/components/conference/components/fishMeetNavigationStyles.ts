import BaseTheme from '../../../../../base/ui/components/BaseTheme.native';

export const styleHeader = {
    viewStyle: {
        backgroundColor: BaseTheme.palette.fishMeetUiBackground,
        height: 60,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row'
    },
    textStyle: {
        color: BaseTheme.palette.text01,
        fontSize: 18,
        flex: 1,
        textAlign: 'center' as const
    },
    touchStyle: {
        position: 'absolute',
        right: 30
    }
};

