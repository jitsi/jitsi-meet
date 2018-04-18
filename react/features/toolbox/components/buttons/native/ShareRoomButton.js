// @flow

import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n';
import { beginShareRoom } from '../../../../share-room';

import AbstractButton from '../AbstractButton';
import type { Props as AbstractButtonProps } from '../AbstractButton';

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
}

/**
 * An implementation of a button for sharing a room using the native OS sharing
 * capabilities.
 */
class ShareRoomButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'Share room';
    iconName = 'icon-link';
    label = 'toolbar.shareRoom';

    /**
     * Handles clicking / pressing the button, and opens the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(beginShareRoom());
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @private
     * @returns {boolean}
     */
    _isDisabled() {
        return false;
    }
}

export default translate(connect()(ShareRoomButton));
