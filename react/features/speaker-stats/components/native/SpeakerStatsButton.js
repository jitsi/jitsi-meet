// @flow

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { connect } from '../../../base/redux';
import { navigate } from '../../../conference/components/native/ConferenceNavigationContainerRef';
import { screen } from '../../../conference/components/native/routes';
import AbstractSpeakerStatsButton from '../AbstractSpeakerStatsButton';

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
        sendAnalytics(createToolbarEvent('speaker.stats'));

        return navigate(screen.conference.speakerStats);
    }
}

export default translate(connect()(SpeakerStatsButton));
