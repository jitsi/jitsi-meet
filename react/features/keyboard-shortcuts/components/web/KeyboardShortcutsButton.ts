import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n/functions';
import { IconShortcuts } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { openSettingsDialog } from '../../../settings/actions';
import { SETTINGS_TABS } from '../../../settings/constants';
import { areKeyboardShortcutsEnabled } from '../../functions';

/**
 * Implementation of a button for opening keyboard shortcuts dialog.
 */
class KeyboardShortcutsButton extends AbstractButton<AbstractButtonProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.shortcuts';
    icon = IconShortcuts;
    label = 'toolbar.shortcuts';
    tooltip = 'toolbar.shortcuts';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        sendAnalytics(createToolbarEvent('shortcuts'));
        dispatch(openSettingsDialog(SETTINGS_TABS.SHORTCUTS));
    }
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
const mapStateToProps = (state: IReduxState) => {
    return {
        visible: !isMobileBrowser() && areKeyboardShortcutsEnabled(state)
    };
};

export default translate(connect(mapStateToProps)(KeyboardShortcutsButton));
