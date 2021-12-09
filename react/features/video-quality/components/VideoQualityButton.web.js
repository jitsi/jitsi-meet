// @flow

import { translate } from '../../base/i18n';
import { IconGauge } from '../../base/icons';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';

/**
 * The type of the React {@code Component} props of
 * {@link VideoQualityButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Whether or not audio only mode is currently enabled.
     */
    _audioOnly: boolean,

    /**
     * The currently configured maximum quality resolution to be received from
     * and sent to remote participants.
     */
    _videoQuality: number,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * React {@code Component} responsible for displaying a button in the overflow
 * menu of the toolbar, including an icon showing the currently selected
 * max receive quality.
 *
 * @augments Component
 */
class VideoQualityButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.callQuality';
    label = 'videoStatus.performanceSettings';
    tooltip = 'videoStatus.performanceSettings';
    icon = IconGauge;


    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { handleClick } = this.props;

        if (handleClick) {
            handleClick();

            return;
        }
    }
}

export default translate(VideoQualityButton);
