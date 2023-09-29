import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { translate } from '../../../base/i18n/functions';
import { IconGear } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { openSettingsDialog } from '../../actions';

/**
 * The type of the React {@code Component} props of {@link SettingsButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * The default tab at which the settings dialog will be opened.
     */
    defaultTab: string;

    /**
     * Indicates whether the device selection dialog is displayed on the
     * welcome page or not.
     */
    isDisplayedOnWelcomePage: boolean;
}

/**
 * An abstract implementation of a button for accessing settings.
 */
class SettingsButton extends AbstractButton<IProps> {
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
        const { dispatch, isDisplayedOnWelcomePage = false } = this.props;

        sendAnalytics(createToolbarEvent('settings'));
        dispatch(openSettingsDialog(undefined, isDisplayedOnWelcomePage));
    }
}

export default translate(connect()(SettingsButton));
