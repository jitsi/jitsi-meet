import { BoxModel, createStyleSheet } from '../../styles';

/**
 * The React {@code Component} styles of {@code Dialog}.
 */
export default createStyleSheet({
    /**
     * Unified container for a consistent Dialog style.
     */
    dialogContainer: {
        paddingHorizontal: BoxModel.padding,
        paddingVertical: 1.5 * BoxModel.padding
    }
});
