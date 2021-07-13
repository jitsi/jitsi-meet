// @flow

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { IconCodeBlock } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';

import EmbedMeetingDialog from './EmbedMeetingDialog';

/**
 * The type of the React {@code Component} props of {@link EmbedMeetingButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * Implementation of a button for opening embed meeting dialog.
 */
class EmbedMeetingButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.embedMeeting';
    icon = IconCodeBlock;
    label = 'toolbar.embedMeeting';
    tooltip = 'toolbar.embedMeeting';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        sendAnalytics(createToolbarEvent('embed.meeting'));
        dispatch(openDialog(EmbedMeetingDialog));
    }
}

export default translate(connect()(EmbedMeetingButton));
