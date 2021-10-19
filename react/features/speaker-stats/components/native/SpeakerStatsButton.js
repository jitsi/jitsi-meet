// @flow

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconPresentation } from '../../../base/icons';
import { setActiveModalId } from '../../../base/modal';
import { connect } from '../../../base/redux';
import {
    AbstractButton,
    AbstractButtonProps
} from '../../../base/toolbox/components';
import { SPEAKER_STATS_VIEW_MODEL_ID } from '../../constants';

/**
 * The type of the React {@code Component} props of {@link SpeakerStatsButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * The {@code JitsiConference} for the current conference.
     */
     _conference: Object,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
};

/**
 * Implementation of a button for opening speaker stats dialog.
 */
class SpeakerStatsButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.speakerStats';
    icon = IconPresentation;
    label = 'toolbar.speakerStats';
    tooltip = 'toolbar.speakerStats';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, handleClick } = this.props;

        if (handleClick) {
            handleClick();

            return;
        }

        sendAnalytics(createToolbarEvent('speaker.stats'));
        dispatch(setActiveModalId(SPEAKER_STATS_VIEW_MODEL_ID));
    }
}

export default translate(connect()(SpeakerStatsButton));
