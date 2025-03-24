import { connect } from 'react-redux';

import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { openDialog } from '../../base/dialog/actions';
import { isMobileBrowser } from '../../base/environment/utils';
import { translate } from '../../base/i18n/functions';
import { IconCode } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { isVpaasMeeting } from '../../jaas/functions';

import EmbedMeetingDialog from './EmbedMeetingDialog';

/**
 * Implementation of a button for opening embed meeting dialog.
 */
class EmbedMeetingButton extends AbstractButton<AbstractButtonProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.embedMeeting';
    override icon = IconCode;
    override label = 'toolbar.embedMeeting';
    override tooltip = 'toolbar.embedMeeting';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch } = this.props;

        sendAnalytics(createToolbarEvent('embed.meeting'));
        dispatch(openDialog(EmbedMeetingDialog));
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
const mapStateToProps = (state: IReduxState) => {
    return {
        visible: !isVpaasMeeting(state) && !isMobileBrowser()
    };
};

export default translate(connect(mapStateToProps)(EmbedMeetingButton));
