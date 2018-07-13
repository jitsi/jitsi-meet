// @flow

import { AbstractButton } from '../../../base/toolbox';
import { translate } from '../../../base/i18n';
import type { AbstractButtonProps } from '../../../base/toolbox';

/**
 * An implementation of a button which rejects an incoming call.
 */
class DeclineButton extends AbstractButton<AbstractButtonProps, *> {
    accessibilityLabel = 'incomingCall.decline';
    iconName = 'hangup';
    label = 'incomingCall.decline';
}

export default translate(DeclineButton);
