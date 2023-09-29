import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { SPEAKERSTATS_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { navigate } from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
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

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code SpeakerStatsButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     visible: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState) {
    const enabled = getFeatureFlag(state, SPEAKERSTATS_ENABLED, true);

    return {
        visible: enabled
    };
}


export default translate(connect(_mapStateToProps)(SpeakerStatsButton));
