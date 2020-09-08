// @flow

import { translate } from '../../base/i18n';
import { IconInfo } from '../../base/icons';
import { setActiveModalId } from '../../base/modal';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { DIAL_IN_SUMMARY_VIEW_ID } from '../../invite/constants';

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
 * A recent list menu button which opens the dial-in info dialog.
 */
class ShowDialInInfoButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'welcomepage.info';
    icon = IconInfo;
    label = 'welcomepage.info';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { dispatch, itemId } = this.props;

        dispatch(setActiveModalId(DIAL_IN_SUMMARY_VIEW_ID, { summaryUrl: itemId.url }));
    }
}

export default translate(connect()(ShowDialInInfoButton));
