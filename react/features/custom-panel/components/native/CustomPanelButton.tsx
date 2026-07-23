import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions.native';
import { IconAI } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { navigate }
    from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../mobile/navigation/routes';
import { isCustomPanelEnabled } from '../../functions.native';

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

/**
 * Maps part of the Redux state to the component's props.
 *
 * @param {IReduxState} state - The Redux state.
 * @private
 * @returns {Object}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        visible: isCustomPanelEnabled(state)
    };
}

export default translate(connect(_mapStateToProps)(CustomPanelButton));
