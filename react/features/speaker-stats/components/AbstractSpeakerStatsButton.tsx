import { IconConnection } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';

/**
 * Implementation of a button for opening speaker stats dialog.
 */
class AbstractSpeakerStatsButton extends AbstractButton<AbstractButtonProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.speakerStats';
    override icon = IconConnection;
    override label = 'toolbar.speakerStats';
    override tooltip = 'toolbar.speakerStats';
}

export default AbstractSpeakerStatsButton;
