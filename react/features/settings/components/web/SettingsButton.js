// @flow

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconGear } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';
import { openSettingsDialog } from '../../actions';
import { SETTINGS_TABS } from '../../constants';

/**
 * The type of the React {@code Component} props of {@link SettingsButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The default tab at which the settings dialog will be opened.
     */
    defaultTab: string,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * Indicates whether the device selection dialog is displayed on the
     * welcome page or not.
     */
    isDisplayedOnWelcomePage: boolean
};

/**
 * An abstract implementation of a button for accessing settings.
 */
class SettingsButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.Settings';
    icon = IconGear;
    label = 'toolbar.Settings';
    tooltip = 'toolbar.Settings';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { defaultTab = SETTINGS_TABS.AUDIO, dispatch, isDisplayedOnWelcomePage = false } = this.props;

        sendAnalytics(createToolbarEvent('settings'));
        dispatch(openSettingsDialog(defaultTab, isDisplayedOnWelcomePage));
    }
}

export default translate(connect()(SettingsButton));
