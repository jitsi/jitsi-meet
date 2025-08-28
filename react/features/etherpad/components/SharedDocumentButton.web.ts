import { connect } from 'react-redux';

import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import { IconShareDoc } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { setOverflowMenuVisible } from '../../toolbox/actions.web';
import { toggleDocument } from '../actions';

interface IProps extends AbstractButtonProps {

    /**
     * Whether the shared document is being edited or not.
     */
    _editing: boolean;
}

/**
 * Implements an {@link AbstractButton} to open the chat screen on mobile.
 */
class SharedDocumentButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.documentOpen';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.documentClose';
    override icon = IconShareDoc;
    override label = 'toolbar.documentOpen';
    override toggledLabel = 'toolbar.documentClose';
    override tooltip = 'toolbar.documentOpen';
    override toggledTooltip = 'toolbar.documentClose';

    /**
     * Handles clicking / pressing the button, and opens / closes the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { _editing, dispatch } = this.props;

        sendAnalytics(createToolbarEvent(
            'toggle.etherpad',
            {
                enable: !_editing
            }));

        dispatch(toggleDocument());
        dispatch(setOverflowMenuVisible(false));
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        return this.props._editing;
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
    const { documentUrl, editing } = state['features/etherpad'];
    const { visible = Boolean(documentUrl) } = ownProps;

    return {
        _editing: editing,
        visible
    };
}

export default translate(connect(_mapStateToProps)(SharedDocumentButton));
