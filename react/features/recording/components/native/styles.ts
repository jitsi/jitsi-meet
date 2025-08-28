import { createStyleSheet } from '../../../base/styles/functions.native';
import BaseTheme from '../../../base/ui/components/BaseTheme';

/**
 * The styles of the React {@code Components} of the feature recording.
 */
export default createStyleSheet({

    /**
     * Style for the recording indicator.
     */
    indicatorStyle: {
        marginRight: 4,
        marginLeft: 0,
        marginBottom: 0,
        backgroundColor: BaseTheme.palette.iconError
    }
});
