/* eslint-disable lines-around-comment */
// @ts-ignore
import { translate } from '../../../../base/i18n';
// @ts-ignore
import { IconSettings } from '../../../../base/icons';
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

export default translate(SettingsButton);
