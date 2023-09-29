import { connect } from 'react-redux';

import { openSheet } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import { IconVolumeUp } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';

import AudioRoutePickerDialog from './AudioRoutePickerDialog';

/**
 * Implements an {@link AbstractButton} to open the audio device list.
 */
class AudioDeviceToggleButton extends AbstractButton<AbstractButtonProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.audioRoute';
    icon = IconVolumeUp;
    label = 'toolbar.accessibilityLabel.audioRoute';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(openSheet(AudioRoutePickerDialog));
    }
}


export default translate(connect()(AudioDeviceToggleButton));
