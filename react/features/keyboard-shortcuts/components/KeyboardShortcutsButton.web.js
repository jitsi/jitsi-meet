// @flow

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { IconDeviceDocument } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { openKeyboardShortcutsDialog } from '../actions';

/**
 * The type of the React {@code Component} props of {@link KeyboardShortcutsButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * Implementation of a button for opening keyboard shortcuts dialog.
 */
class KeyboardShortcutsButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.shortcuts';
    icon = IconDeviceDocument;
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
        dispatch(openKeyboardShortcutsDialog());
    }
}

export default translate(connect()(KeyboardShortcutsButton));
