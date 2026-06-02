import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconShareDoc } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { openFileSharingPanel } from '../../../chat/actions.any';
import { isFileSharingEnabled } from '../../functions.any';

/**
 * Component that renders a button to open the file sharing panel.
 *
 * @augments AbstractButton
 */
class FileSharingButton extends AbstractButton<AbstractButtonProps> {
    override icon = IconShareDoc;
    override label = 'toolbar.fileSharing';
    override tooltip = 'toolbar.fileSharing';

    /**
     * Handles clicking the button to open the file sharing panel.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch } = this.props;

        dispatch(openFileSharingPanel());
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
        visible: isFileSharingEnabled(state)
    };
}

export default translate(connect(mapStateToProps)(FileSharingButton));
