// @flow

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconInviteMore } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { beginAddPeople } from '../../../invite';

/**
 * The type of the React {@code Component} props of {@link InviteButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The Redux dispatch function.
     */
    dispatch: Function
};

/**
 * An implementation of a button for toggling the camera facing mode.
 */
class InviteButton extends AbstractButton<Props, any> {
    accessibilityLabel = 'toolbar.accessibilityLabel.invite';
    icon = IconInviteMore;
    label = 'toolbar.invite';

    /**
     * Handles clicking/pressing the button.
     *
     * @returns {void}
     */
    _handleClick() {
        sendAnalytics(createToolbarEvent('invite'));
        this.props.dispatch(beginAddPeople());
    }

}

export default translate(connect(null)(InviteButton));
