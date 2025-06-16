import { connect } from 'react-redux';

import { IReduxState } from '../../../../app/types';
import { translate } from '../../../../base/i18n/functions';
import { IconGear } from '../../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../../base/toolbox/components/AbstractButton';
import { navigate }
    from '../../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../../mobile/navigation/routes';
import { SETTINGS_ENABLED } from '../../../flags/constants';
import { getFeatureFlag } from '../../../flags/functions';

/**
 * Implements an {@link AbstractButton} to open the carmode.
 */
class SettingsButton extends AbstractButton<AbstractButtonProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.Settings';
    icon = IconGear;
    label = 'settings.buttonLabel';

    /**
     * Handles clicking / pressing the button, and opens the carmode mode.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        return navigate(screen.settings.main);
    }
}


/**
 * Maps part of the redux state to the component's props.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {Object}
 */
function _mapStateToProps(state: IReduxState) {
    const enabled = getFeatureFlag(state, SETTINGS_ENABLED, true);

    return {
        visible: enabled
    };
}

export default translate(connect(_mapStateToProps)(SettingsButton));
