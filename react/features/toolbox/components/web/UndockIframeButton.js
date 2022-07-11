// @flow

import { translate } from '../../../base/i18n';
import { IconUndock } from '../../../base/icons';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox/components';

declare var APP: Object;

/**
 * Implementation of a button for notifying integrators that iframe should be undocked.
 */
class UndockIframeButton extends AbstractButton<AbstractButtonProps, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.undock';
    icon = IconUndock;
    label = 'toolbar.undock';
    tooltip = 'toolbar.undock';

    /**
     * Handles clicking / pressing the button by triggering external api event.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        APP.API.notifyIframeDockStateChanged(false);
    }
}

export default translate(UndockIframeButton);
