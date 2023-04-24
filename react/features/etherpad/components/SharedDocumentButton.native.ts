import { connect } from 'react-redux';

import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import { IconShareDoc } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { navigate } from '../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../mobile/navigation/routes';

/**
 * Implements an {@link AbstractButton} to open the chat screen on mobile.
 */
class SharedDocumentButton extends AbstractButton<AbstractButtonProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.document';
    icon = IconShareDoc;
    label = 'toolbar.documentOpen';
    tooltip = 'toolbar.documentOpen';

    /**
     * Handles clicking / pressing the button, and opens / closes the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { handleClick } = this.props;

        if (handleClick) {
            handleClick();

            return;
        }

        sendAnalytics(createToolbarEvent(
            'toggle.etherpad',
            {
                enable: true
            }));

        navigate(screen.conference.sharedDocument);
    }
}

/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The redux store/state.
 * @param {Object} ownProps - The properties explicitly passed to the component
 * instance.
 * @returns {Object}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { documentUrl } = state['features/etherpad'];
    const { visible = Boolean(documentUrl) } = ownProps;

    return {
        visible
    };
}

export default translate(connect(_mapStateToProps)(SharedDocumentButton));
