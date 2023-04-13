import { connect } from 'react-redux';

import { translate } from '../../base/i18n/functions';
import { IconTrash } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { deleteRecentListEntry } from '../actions';

export interface IProps extends AbstractButtonProps {

    /**
     * The ID of the entry to be deleted.
     */
    itemId: Object;
}

/**
 * A recent list menu button which deletes the selected entry.
 */
class DeleteItemButton extends AbstractButton<IProps> {
    accessibilityLabel = 'welcomepage.recentListDelete';
    icon = IconTrash;
    label = 'welcomepage.recentListDelete';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, itemId } = this.props;

        dispatch(deleteRecentListEntry(itemId));
    }
}

export default translate(connect()(DeleteItemButton));
