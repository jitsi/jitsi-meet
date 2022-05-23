// @flow

import { translate } from '../../../base/i18n';
import { IconDock } from '../../../base/icons';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';

declare var APP: Object;

/**
 * Implementation of a button for notifying integrators that iframe should be docked.
 */
class DockIframeButton extends AbstractButton<AbstractButtonProps, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.dock';
    icon = IconDock;
    label = 'toolbar.dock';
    tooltip = 'toolbar.dock';

    /**
     * Handles clicking / pressing the button by triggering external api event.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        APP.API.notifyIframeDockStateChanged(true);
    }
}

export default translate(DockIframeButton);
