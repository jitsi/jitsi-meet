// @flow

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconPresentation } from '../../../base/icons';
import { AbstractButton } from '../../../base/toolbox/components';
import { navigate } from '../../../conference/components/native/ConferenceNavigationContainerRef';
import { screen } from '../../../conference/components/native/routes';

/**
 * Implementation of a button for opening speaker stats dialog.
 */
class SpeakerStatsButton extends AbstractButton<*, *> {
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

export default translate(SpeakerStatsButton);
