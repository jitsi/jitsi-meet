// @flow

import { translate } from '../../../base/i18n';
import { IconMenu } from '../../../base/icons';
import { AbstractButton } from '../../../base/toolbox';
import type { AbstractButtonProps } from '../../../base/toolbox';


type Props = AbstractButtonProps;

/**
 * An implementation of a button to show more menu options.
 */
class MoreOptionsButton extends AbstractButton<Props, any> {
    accessibilityLabel = 'toolbar.accessibilityLabel.moreOptions';
    icon = IconMenu;
    label = 'toolbar.moreOptions';
}


export default translate(MoreOptionsButton);
