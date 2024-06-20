import { connect } from 'react-redux';

import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { translate } from '../../base/i18n/functions';
import { IconGoLive } from '../../base/icons/svg';
import AbstractButton, { IProps } from '../../base/toolbox/components/AbstractButton';
import { goLive } from '../actions';

/**
 * Implements an {@link AbstractButton} to set the meeting to live and to invite all visitors.
 */
class GoLiveButton extends AbstractButton<IProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.golive';
    icon = IconGoLive;
    label = 'toolbar.golive';
    tooltip = 'toolbar.golive';

    /**
     * Handles clicking / pressing the button, and opens a new window with the user documentation.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch } = this.props;

        sendAnalytics(createToolbarEvent('golive.pressed'));

        dispatch(goLive());
    }
}


export default translate(connect()(GoLiveButton));
