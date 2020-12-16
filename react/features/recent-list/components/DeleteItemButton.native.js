// @flow

import { translate } from '../../base/i18n';
import { IconTrash } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { deleteRecentListEntry } from '../actions';

export type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * The ID of the entry to be deleted.
     */
    itemId: Object,

    /**
     * The function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * A recent list menu button which deletes the selected entry.
 */
class DeleteItemButton extends AbstractButton<Props, *> {
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
