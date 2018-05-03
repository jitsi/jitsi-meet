import {
    BoxModel,
    ColorPalette,
    createStyleSheet
} from '../../../base/styles';

const TEXT_COLOR = ColorPalette.white;

export default createStyleSheet({
    button: {
        color: TEXT_COLOR,
        margin: BoxModel.margin
    }
});
