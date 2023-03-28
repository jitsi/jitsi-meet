import { IStore } from '../../app/types';
import { IconConnection } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';

type Props = AbstractButtonProps & {

    /**
     * True if the navigation bar should be visible.
     */
    dispatch: IStore['dispatch'];
};


/**
 * Implementation of a button for opening speaker stats dialog.
 */
class AbstractSpeakerStatsButton extends AbstractButton<Props> {
    accessibilityLabel = 'toolbar.accessibilityLabel.speakerStats';
    icon = IconConnection;
    label = 'toolbar.speakerStats';
    tooltip = 'toolbar.speakerStats';
}

export default AbstractSpeakerStatsButton;
