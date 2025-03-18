import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { openDialog } from '../../base/dialog/actions';
import { IconMicSlash } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';

import { MuteEveryoneDialog } from './';

export interface IProps extends AbstractButtonProps {

    /**
     * The ID of the participant object that this button is supposed to keep unmuted.
     */
    participantID: string;
}

/**
 * An abstract remote video menu button which mutes all the other participants.
 */
export default class AbstractMuteEveryoneElseButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.muteEveryoneElse';
    override icon = IconMicSlash;
    override label = 'videothumbnail.domuteOthers';

    /**
     * Handles clicking / pressing the button, and opens a confirmation dialog.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch, participantID } = this.props;

        sendAnalytics(createToolbarEvent('mute.everyoneelse.pressed'));
        dispatch(openDialog(MuteEveryoneDialog, { exclude: [ participantID ] }));
    }
}
