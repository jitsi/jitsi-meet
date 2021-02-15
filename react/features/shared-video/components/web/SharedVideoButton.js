// @flow

import { createSharedVideoEvent, sendAnalytics } from '../../../analytics';
import { toggleDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { IconShareVideo } from '../../../base/icons';
import { connect } from '../../../base/redux';
import {
    AbstractButton,
    type AbstractButtonProps
} from '../../../base/toolbox/components';

import { ShareVideoDialog } from './';


type Props = AbstractButtonProps & {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function
};

/**
 * Implements an {@link AbstractButton} to open the user documentation in a new window.
 */
class SharedVideoButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.sharedvideo';
    icon = IconShareVideo;
    label = 'toolbar.sharedvideos';
    tooltip = 'toolbar.sharedvideo';

    /**
     * Handles clicking / pressing the button, and opens a new dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        sendAnalytics(createSharedVideoEvent('started'));
        dispatch(toggleDialog(ShareVideoDialog));
    }
}


export default translate(connect()(SharedVideoButton));
