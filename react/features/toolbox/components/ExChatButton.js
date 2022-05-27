// @flow
import { translate } from '../../base/i18n';
import { IconChat } from '../../base/icons';

import { connect } from '../../base/redux';
import { AbstractButton } from '../../base/toolbox/components';
import type { AbstractButtonProps } from '../../base/toolbox/components';

declare var APP: Object;

/**
 * The type of the React {@code Component} props of {@link HangupButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * Component that renders a toolbar button for leaving the current conference.
 *
 * @extends AbstractButton
 */
class ExChatButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.exChat';
    icon = IconChat;
    label = 'toolbar.exChat';
    tooltip = 'toolbar.exChat';
    className = 'ex-btn-default';

    /**
     * Handles clicking / pressing the button, fire custom events.
     *
     * @returns {void}
     */
    _handleClick() {
        APP.API.notifyExChat();
    }
}

export default translate(connect()(ExChatButton));
