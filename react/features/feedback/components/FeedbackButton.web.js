
// @flow

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { IconFeedback } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { openFeedbackDialog } from '../actions';

/**
 * The type of the React {@code Component} props of {@link FeedbackButton}.
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
 * Implementation of a button for opening feedback dialog.
 */
class FeedbackButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.feedback';
    icon = IconFeedback;
    label = 'toolbar.feedback';
    tooltip = 'toolbar.feedback';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        const { _conference, dispatch } = this.props;

        sendAnalytics(createToolbarEvent('feedback'));
        dispatch(openFeedbackDialog(_conference));
    }
}

const mapStateToProps = state => {
    return {
        _conference: state['features/base/conference'].conference
    };
};

export default translate(connect(mapStateToProps)(FeedbackButton));
