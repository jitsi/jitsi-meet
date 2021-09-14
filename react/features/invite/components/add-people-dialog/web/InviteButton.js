// @flow

import { createToolbarEvent, sendAnalytics } from '../../../../analytics';
import { translate } from '../../../../base/i18n';
import { IconAddPeople } from '../../../../base/icons';
import { connect } from '../../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../../base/toolbox/components';
import { beginAddPeople } from '../../../actions.any';

/**
 * The type of the React {@code Component} props of {@link EmbedMeetingButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * Implementation of a button for opening invite people dialog.
 */
class InviteButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.invite';
    icon = IconAddPeople;
    label = 'toolbar.invite';
    tooltip = 'toolbar.invite';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, handleClick } = this.props;

        if (handleClick) {
            handleClick();

            return;
        }

        sendAnalytics(createToolbarEvent('invite'));
        dispatch(beginAddPeople());
    }
}

export default translate(connect()(InviteButton));
