// @flow

import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { IconAudioRoute } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton } from '../../../base/toolbox';
import type { AbstractButtonProps } from '../../../base/toolbox';

import AudioRoutePickerDialog from './AudioRoutePickerDialog';


type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function used to open/show the
     * {@code AudioRoutePickerDialog}.
     */
    dispatch: Function
};

/**
 * A toolbar button which triggers an audio route picker when pressed.
 */
class AudioRouteButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.audioRoute';
    icon = IconAudioRoute;
    label = 'toolbar.audioRoute';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(openDialog(AudioRoutePickerDialog));
    }
}

export default translate(connect()(AudioRouteButton));
