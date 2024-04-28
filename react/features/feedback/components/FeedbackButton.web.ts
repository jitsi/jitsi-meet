
import { connect } from 'react-redux';

import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { IJitsiConference } from '../../base/conference/reducer';
import { translate } from '../../base/i18n/functions';
import { IconFeedback } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { openFeedbackDialog } from '../actions';
import { shouldSendJaaSFeedbackMetadata } from '../functions.web';

/**
 * The type of the React {@code Component} props of {@link FeedbackButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * The {@code JitsiConference} for the current conference.
     */
    _conference?: IJitsiConference;
}

/**
 * Implementation of a button for opening feedback dialog.
 */
class FeedbackButton extends AbstractButton<IProps> {
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

const mapStateToProps = (state: IReduxState) => {
    const { conference } = state['features/base/conference'];

    return {
        _conference: conference,
        visible: shouldSendJaaSFeedbackMetadata(state)
    };
};

export default translate(connect(mapStateToProps)(FeedbackButton));
