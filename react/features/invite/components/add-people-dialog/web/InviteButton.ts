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
    override accessibilityLabel = 'toolbar.accessibilityLabel.invite';
    override icon = IconAddUser;
    override label = 'toolbar.invite';
    override tooltip = 'toolbar.invite';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch } = this.props;

        sendAnalytics(createToolbarEvent('invite'));
        dispatch(beginAddPeople());
    }
}

export default translate(connect()(InviteButton));
