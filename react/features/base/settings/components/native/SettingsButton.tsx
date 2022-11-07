import { IReduxState } from '../../../../app/types';
import { AbstractButton, type AbstractButtonProps } from '../../../../base/toolbox/components';
import { navigate }
    from '../../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../../mobile/navigation/routes';
import { SETTINGS_ENABLED, getFeatureFlag } from '../../../flags';
import { translate } from '../../../i18n/functions';
import { IconSettings } from '../../../icons/svg';
import { connect } from '../../../redux/functions';

/**
 * Implements an {@link AbstractButton} to open the carmode.
 */
class SettingsButton extends AbstractButton<AbstractButtonProps, any, any> {
    accessibilityLabel = 'toolbar.accessibilityLabel.Settings';
    icon = IconSettings;
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

// @ts-ignore
export default translate(connect(_mapStateToProps)(SettingsButton));
