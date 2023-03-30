import { translate } from '../../base/i18n/functions';
import { IconPerformance } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';

/**
 * The type of the React {@code Component} props of
 * {@link VideoQualityButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * Whether or not audio only mode is currently enabled.
     */
    _audioOnly: boolean;

    /**
     * The currently configured maximum quality resolution to be received from
     * and sent to remote participants.
     */
    _videoQuality: number;
}

/**
 * React {@code Component} responsible for displaying a button in the overflow
 * menu of the toolbar, including an icon showing the currently selected
 * max receive quality.
 *
 * @augments Component
 */
class VideoQualityButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.callQuality';
    label = 'videoStatus.performanceSettings';
    tooltip = 'videoStatus.performanceSettings';
    icon = IconPerformance;
}

export default translate(VideoQualityButton);
