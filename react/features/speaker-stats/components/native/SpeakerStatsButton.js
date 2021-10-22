// @flow

import { connect } from 'react-redux';
import type { Dispatch } from 'redux';

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconPresentation } from '../../../base/icons';
import { AbstractButton } from '../../../base/toolbox/components';
import { navigate } from '../../../conference/components/native/ConferenceNavigationContainerRef';
import { screen } from '../../../conference/components/native/routes';

type Props = {

    /**
     * True if the navigation bar should be visible.
     */
    dispatch: Dispatch<any>
};


/**
 * Implementation of a button for opening speaker stats dialog.
 */
class SpeakerStatsButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.speakerStats';
    icon = IconPresentation;
    label = 'toolbar.speakerStats';
    tooltip = 'toolbar.speakerStats';

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
