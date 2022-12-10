import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { openDialog } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import { connect } from '../../../base/redux/functions';
import AbstractSpeakerStatsButton from '../AbstractSpeakerStatsButton';

import SpeakerStats from './SpeakerStats';


/**
 * Implementation of a button for opening speaker stats dialog.
 */
class SpeakerStatsButton extends AbstractSpeakerStatsButton {

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        // @ts-ignore
        const { dispatch } = this.props;

        sendAnalytics(createToolbarEvent('speaker.stats'));
        dispatch(openDialog(SpeakerStats));
    }
}

// @ts-ignore
export default translate(connect()(SpeakerStatsButton));
