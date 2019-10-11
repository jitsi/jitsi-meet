// @flow

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconHelp } from '../../../base/icons';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox';

declare var interfaceConfig: Object;

/**
 * Implements an {@link AbstractButton} to open the user documentation in a new window.
 */
class HelpButton extends AbstractButton<AbstractButtonProps, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.help';
    icon = IconHelp;
    label = 'toolbar.help';

    /**
     * Handles clicking / pressing the button, and opens a new window with the user documentation.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        sendAnalytics(createToolbarEvent('help.pressed'));
        window.open(interfaceConfig.HELP_LINK);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Node}
     */
    render(): React$Node {
        if (typeof interfaceConfig.HELP_LINK === 'string') {
            return super.render();
        }

        return null;
    }
}

export default translate(HelpButton);
