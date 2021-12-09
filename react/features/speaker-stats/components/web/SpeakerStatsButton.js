// @flow

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import AbstractSpeakerStatsButton from '../AbstractSpeakerStatsButton';

import { SpeakerStats } from './';

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
        const { dispatch, handleClick } = this.props;

        if (handleClick) {
            handleClick();

            return;
        }

        sendAnalytics(createToolbarEvent('speaker.stats'));
        dispatch(openDialog(SpeakerStats));
    }
}

export default translate(connect()(SpeakerStatsButton));
