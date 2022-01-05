// @flow

import type { Dispatch } from 'redux';

import { IconPresentation } from '../../base/icons';
import { AbstractButton } from '../../base/toolbox/components';
import type { AbstractButtonProps } from '../../base/toolbox/components';

type Props = AbstractButtonProps & {

    /**
     * True if the navigation bar should be visible.
     */
    dispatch: Dispatch<any>
};


/**
 * Implementation of a button for opening speaker stats dialog.
 */
class AbstractSpeakerStatsButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.speakerStats';
    icon = IconPresentation;
    label = 'toolbar.speakerStats';
    tooltip = 'toolbar.speakerStats';
}

export default AbstractSpeakerStatsButton;
