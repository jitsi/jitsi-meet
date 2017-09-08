import {
    ColorPalette,
    createStyleSheet
} from '../../base/styles';

/**
 * The styles of the authentication feature.
 */
export default createStyleSheet({
    outerArea: {
        flex: 1
    },
    dialogBox: {
        marginLeft: '10%',
        marginRight: '10%',
        marginTop: '10%',
        backgroundColor: ColorPalette.white
    },
    textInput: {
        height: 25,
        fontSize: 16
    }
});
