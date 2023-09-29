import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../../analytics/functions';
import { translate } from '../../../../base/i18n/functions';
import { IconAddUser } from '../../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../../base/toolbox/components/AbstractButton';
import { beginAddPeople } from '../../../actions.any';

/**
 * Implementation of a button for opening invite people dialog.
 */
class InviteButton extends AbstractButton<AbstractButtonProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.invite';
    icon = IconAddUser;
    label = 'toolbar.invite';
    tooltip = 'toolbar.invite';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        sendAnalytics(createToolbarEvent('invite'));
        dispatch(beginAddPeople());
    }
}

export default translate(connect()(InviteButton));
