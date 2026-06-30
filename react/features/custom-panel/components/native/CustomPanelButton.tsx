import { connect } from 'react-redux';

import { translate } from '../../../base/i18n/functions';
import { IconAI } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { navigate }
    from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';

/**
 * Implements an {@link AbstractButton} to open the Copilot screen on mobile.
 */
class CustomPanelButton extends AbstractButton<AbstractButtonProps> {
    override accessibilityLabel = 'toolbar.copilot';
    override icon = IconAI;
    override label = 'toolbar.copilot';

    /**
     * Handles clicking / pressing the button — opens the Copilot screen.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        navigate(screen.conference.customPanel);
    }
}

export default translate(connect()(CustomPanelButton));
