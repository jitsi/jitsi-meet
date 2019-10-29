// @flow

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconSettings } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton } from '../../../base/toolbox';
import type { AbstractButtonProps } from '../../../base/toolbox';
import { openDeviceSelectionPopup } from '../../../device-selection';

import { openSettingsDialog } from '../../actions';
import { SETTINGS_TABS } from '../../constants';

declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link SettingsButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether we are in filmstrip only mode or not.
     */
    _filmstripOnly: boolean,

    /**
     * The default tab at which the settings dialog will be opened.
     */
    defaultTab: string,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * An abstract implementation of a button for accessing settings.
 */
class SettingsButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.Settings';
    icon = IconSettings;
    label = 'toolbar.Settings';
    tooltip = 'toolbar.Settings';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const {
            _filmstripOnly,
            defaultTab = SETTINGS_TABS.DEVICES,
            dispatch } = this.props;

        sendAnalytics(createToolbarEvent('settings'));
        if (_filmstripOnly) {
            dispatch(openDeviceSelectionPopup());
        } else {
            dispatch(openSettingsDialog(defaultTab));
        }
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code SettingsButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _filmstripOnly: boolean
 * }}
 */
function _mapStateToProps(state): Object { // eslint-disable-line no-unused-vars
    // XXX: We are not currently using state here, but in the future, when
    // interfaceConfig is part of redux we will.

    return {
        _filmstripOnly: Boolean(interfaceConfig.filmStripOnly)
    };
}

export default translate(connect(_mapStateToProps)(SettingsButton));
