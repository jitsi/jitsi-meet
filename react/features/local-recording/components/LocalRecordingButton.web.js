// @flow

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { IconRec } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';

import LocalRecordingInfoDialog from './LocalRecordingInfoDialog';

/**
 * The type of the React {@code Component} props of {@link LocalRecording}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * Implementation of a button for opening local recording dialog.
 */
class LocalRecording extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.localRecording';
    icon = IconRec;
    label = 'localRecording.dialogTitle';
    tooltip = 'localRecording.dialogTitle';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        sendAnalytics(createToolbarEvent('local.recording'));
        dispatch(openDialog(LocalRecordingInfoDialog));
    }
}

export default translate(connect()(LocalRecording));
