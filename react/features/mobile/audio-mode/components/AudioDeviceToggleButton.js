import type { Dispatch } from 'redux';

import { openSheet } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { IconVolumeUp } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';

import AudioRoutePickerDialog from './AudioRoutePickerDialog';

type Props = AbstractButtonProps & {

    /**
     * The Redux dispatch function.
     */
    dispatch: Dispatch<any>
};

/**
 * Implements an {@link AbstractButton} to open the audio device list.
 */
class AudioDeviceToggleButton extends AbstractButton<Props, *> {
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
