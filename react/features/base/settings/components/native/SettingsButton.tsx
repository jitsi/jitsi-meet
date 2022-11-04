/* eslint-disable lines-around-comment */

import { SETTINGS_ENABLED, getFeatureFlag } from '../../../../base/flags';
import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import { IconSettings } from '../../../../base/icons/svg';
// @ts-ignore
import { AbstractButton, type AbstractButtonProps } from '../../../../base/toolbox/components';
// @ts-ignore
import { navigate }
// @ts-ignore
    from '../../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
// @ts-ignore
import { screen } from '../../../../mobile/navigation/routes';

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
 * @param {Object} state - The redux store/state.
 * @returns {Object}
 */
function _mapStateToProps(state: Object) {
    const enabled = getFeatureFlag(state, SETTINGS_ENABLED, true);

    return {
        visible: enabled
    };
}

// @ts-ignore
export default translate(connect(_mapStateToProps)(SettingsButton));
