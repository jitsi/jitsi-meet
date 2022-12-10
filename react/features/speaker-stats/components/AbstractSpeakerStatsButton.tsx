import { IStore } from '../../app/types';
import { IconConnection } from '../../base/icons/svg';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';

type Props = AbstractButtonProps & {

    /**
     * True if the navigation bar should be visible.
     */
    dispatch: IStore['dispatch'];
};


/**
 * Implementation of a button for opening speaker stats dialog.
 */
class AbstractSpeakerStatsButton extends AbstractButton<Props, any, any> {
    accessibilityLabel = 'toolbar.accessibilityLabel.speakerStats';
    icon = IconConnection;
    label = 'toolbar.speakerStats';
    tooltip = 'toolbar.speakerStats';
}

export default AbstractSpeakerStatsButton;
