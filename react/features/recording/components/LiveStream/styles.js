// @flow

import { BoxModel, createStyleSheet } from '../../../base/styles';

/**
 * The styles of the React {@code Components} of LiveStream.
 */
export default createStyleSheet({

    streamKeyFormWrapper: {
        flexDirection: 'column',
        padding: BoxModel.padding
    },

    streamKeyHelp: {
        alignSelf: 'flex-end'
    },

    streamKeyInput: {
        alignSelf: 'stretch',
        height: 50
    },

    streamKeyInputLabel: {
        alignSelf: 'flex-start'
    }

});
