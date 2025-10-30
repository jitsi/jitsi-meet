import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconInfo } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { openPollsPanel } from '../../../chat/actions.any';
import { arePollsDisabled } from '../../../conference/functions.any';

/**
 * Component that renders a button to open the polls panel.
 *
 * @augments AbstractButton
 */
class PollsButton extends AbstractButton<AbstractButtonProps> {
    override icon = IconInfo;
    override label = 'toolbar.polls';
    override tooltip = 'toolbar.polls';

    /**
     * Handles clicking the button to open the polls panel.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch } = this.props;

        dispatch(openPollsPanel());
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {Object} - Mapped props.
 */
function mapStateToProps(state: IReduxState) {
    return {
        visible: !arePollsDisabled(state)
    };
}

export default translate(connect(mapStateToProps)(PollsButton));
