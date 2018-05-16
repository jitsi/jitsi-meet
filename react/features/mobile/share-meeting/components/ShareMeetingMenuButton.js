// @flow

import { connect } from 'react-redux';

import { openDialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { AbstractButton } from '../../../base/toolbox';
import type { AbstractButtonProps } from '../../../base/toolbox';

import ShareMeetingMenu from './ShareMeetingMenu';

type Props = AbstractButtonProps & {

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
}

/**
 * An implementation of a button for showing the {@code ShareMenu}.
 */
class ShareMeetingMenuButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'Share menu';
    iconName = 'icon-share';
    label = 'toolbar.shareRoom';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        this.props.dispatch(openDialog(ShareMeetingMenu));
    }
}

export default translate(connect()(ShareMeetingMenuButton));
