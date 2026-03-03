import BaseTheme from '../../../base/ui/components/BaseTheme.native';

const BUTTON_SIZE = 48;


export const fishMeetToolbarButton = {
    borderRadius: BaseTheme.shape.borderRadius,
    borderWidth: 0,
    flex: 0,
    flexDirection: 'row',
    height: BUTTON_SIZE,
    justifyContent: 'center',
    marginHorizontal: 4, // fishmeet: was 6 — reduced to fit 5 buttons on 375pt screens
    marginVertical: 2,
    width: BUTTON_SIZE
};

/**
 * The icon style of the toolbar buttons.
 */
const toolbarButtonIcon = {
    alignSelf: 'center',
    color: BaseTheme.palette.icon04,
    fontSize: 20
};


export const fishMeetToolbarButtonIcon = {
    ...toolbarButtonIcon,
    color: 'transparent'
};

/**
 * The Toolbox and toolbar related styles.
 */
const fishMeetStyles = {
    fishMeetToolbox: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.fishMeetUiBackground,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center'
    },

    fishMeetToolboxContainer: {
        flexDirection: 'row',
        backgroundColor: BaseTheme.palette.fishMeetMainColor02,
        borderRadius: 30,
        paddingLeft: 8, // fishmeet: was 10 — reduced to fit 5 buttons on 375pt screens
        paddingRight: 8, // fishmeet: was 10 — reduced to fit 5 buttons on 375pt screens
        marginRight: 15,
        marginBottom: 10,
        flexWrap: 'wrap'
    },
    fishMeetToolSeparator: {
        width: 1,
        backgroundColor: '#424350',
        marginBottom: 10,
        marginTop: 10
    }
};

export default fishMeetStyles;
