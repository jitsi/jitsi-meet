import { IconConnection } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';

/**
 * Implementation of a button for opening speaker stats dialog.
 */
class AbstractSpeakerStatsButton extends AbstractButton<AbstractButtonProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.speakerStats';
    icon = IconConnection;
    label = 'toolbar.speakerStats';
    tooltip = 'toolbar.speakerStats';
}

export default AbstractSpeakerStatsButton;
