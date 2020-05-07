// @flow

import React from 'react';

import { createE2EEEvent, sendAnalytics } from '../../analytics';
import { openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { IconRoomUnlock } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, BetaTag } from '../../base/toolbox';
import type { AbstractButtonProps } from '../../base/toolbox';

import E2EEDialog from './E2EEDialog';


type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function

};

/**
 * Button that open a dialog to set the E2EE key.
 */
class E2EEButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.e2ee';
    icon = IconRoomUnlock;
    label = 'toolbar.e2ee';
    tooltip = 'toolbar.e2ee';

    /**
     * Helper function to be implemented by subclasses, which returns
     * a React Element to display (a beta tag) at the end of the button.
     *
     * @override
     * @protected
     * @returns {ReactElement}
     */
    _getElementAfter() {
        return <BetaTag />;
    }

    /**
     * Handles clicking / pressing the button, and opens the E2EE dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        sendAnalytics(createE2EEEvent('dialog.open'));
        this.props.dispatch(openDialog(E2EEDialog));
    }
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the Component.
 * @private
 * @returns {Props}
 */
export function mapStateToProps(state: Object, ownProps: Props) {
    const { e2eeSupported } = state['features/base/conference'];
    const { visible = Boolean(e2eeSupported) } = ownProps;

    return {
        visible
    };
}


export default translate(connect(mapStateToProps)(E2EEButton));
