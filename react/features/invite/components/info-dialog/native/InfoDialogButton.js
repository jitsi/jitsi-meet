// @flow

import type { Dispatch } from 'redux';

import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import { AbstractButton } from '../../../../base/toolbox';
import type { AbstractButtonProps } from '../../../../base/toolbox';
import { beginShareRoom } from '../../../../share-room';

type Props = AbstractButtonProps & {

    /**
     * The Redux dispatch function.
     */
    dispatch: Dispatch<any>
};

/**
 * Implements an {@link AbstractButton} to open the info dialog of the meeting.
 */
class InfoDialogButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'info.accessibilityLabel';
    iconName = 'icon-info';
    label = 'info.label';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(beginShareRoom());
    }
}

export default translate(connect()(InfoDialogButton));
