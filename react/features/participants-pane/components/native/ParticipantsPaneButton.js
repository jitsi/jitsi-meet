// @flow

import type { Dispatch } from 'redux';

import { translate } from '../../../base/i18n';
import { IconParticipants } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { navigate }
    from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>
};


/**
 * Implements an {@link AbstractButton} to open the participants panel.
 */
class ParticipantsPaneButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.participants';
    icon = IconParticipants;
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
