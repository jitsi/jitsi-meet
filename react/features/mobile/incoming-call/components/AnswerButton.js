// @flow

import { AbstractButton } from '../../../base/toolbox';
import { translate } from '../../../base/i18n';
import type { AbstractButtonProps } from '../../../base/toolbox';

/**
 * An implementation of a button which accepts an incoming call.
 */
class AnswerButton extends AbstractButton<AbstractButtonProps, *> {
    accessibilityLabel = 'incomingCall.answer';
    iconName = 'hangup';
    label = 'incomingCall.answer';
}

export default translate(AnswerButton);
