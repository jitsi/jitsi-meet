// @flow

import { connect } from 'react-redux';

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { AbstractButton } from '../../../base/toolbox';
import type { AbstractButtonProps } from '../../../base/toolbox';
import { openDeviceSelectionDialog } from '../../../device-selection';
import { toggleSettings } from '../../../side-panel';

declare var interfaceConfig: Object;

type Props = AbstractButtonProps & {

    /**
     * Whether we are in filmstrip only mode or not.
     */
    _filmstripOnly: boolean,

    /**
     * Array containing the enabled settings sections.
     */
    _sections: Array<string>,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * An abstract implementation of a button for accessing settings.
 */
class SettingsButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'Settings';
    iconName = 'icon-settings';
    label = 'toolbar.Settings';
    tooltip = 'toolbar.Settings';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { _filmstripOnly, _sections, dispatch } = this.props;

        sendAnalytics(createToolbarEvent('settings'));
        if (_filmstripOnly
                || (_sections.length === 1 && _sections.includes('devices'))) {
            dispatch(openDeviceSelectionDialog());
        } else {
            dispatch(toggleSettings());
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
        _filmstripOnly: Boolean(interfaceConfig.filmStripOnly),
        _sections: interfaceConfig.SETTINGS_SECTIONS || []
    };
}

export default translate(connect(_mapStateToProps)(SettingsButton));
