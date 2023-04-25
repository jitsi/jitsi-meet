import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconUsers } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { navigate }
    from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';


/**
 * Implements an {@link AbstractButton} to open the participants panel.
 */
class ParticipantsPaneButton extends AbstractButton<AbstractButtonProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.participants';
    icon = IconUsers;
    label = 'toolbar.participants';

    /**
     * Handles clicking / pressing the button, and opens the participants panel.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        return navigate(screen.conference.participants);
    }
}

export default translate(connect()(ParticipantsPaneButton));
