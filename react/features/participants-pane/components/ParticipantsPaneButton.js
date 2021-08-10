// @flow

import { translate } from '../../base/i18n';
import { IconParticipants } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';

/**
 * The type of the React {@code Component} props of {@link ParticipantsPaneButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * External handler for click action.
     */
    handleClick: Function
};

/**
 * Implementation of a button for accessing participants pane.
 */
class ParticipantsPaneButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.participants';
    icon = IconParticipants;
    label = 'toolbar.participants';
    tooltip = 'toolbar.participants';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        this.props.handleClick();
    }
}

export default translate(connect()(ParticipantsPaneButton));
