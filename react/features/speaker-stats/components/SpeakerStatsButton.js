// @flow

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { openDialog } from '../../base/dialog';
import { translate } from '../../base/i18n';
import { IconPresentation } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';

import SpeakerStats from './SpeakerStats';

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
        const { _conference, dispatch } = this.props;

        sendAnalytics(createToolbarEvent('speaker.stats'));
        dispatch(openDialog(SpeakerStats, {
            conference: _conference
        }));
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code SpeakerStatsButton} component's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Object}
 */
function mapStateToProps(state) {
    return {
        _conference: state['features/base/conference'].conference
    };
}

export default translate(connect(mapStateToProps)(SpeakerStatsButton));
