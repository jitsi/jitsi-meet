// @flow

import { connect } from 'react-redux';

import { translate } from '../../base/i18n/functions';
import { IconInfoCircle } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { navigateRoot } from '../../mobile/navigation/rootNavigationContainerRef';
import { screen } from '../../mobile/navigation/routes';

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
    icon = IconInfoCircle;
    label = 'welcomepage.info';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const { itemId } = this.props;

        navigateRoot(screen.dialInSummary, {
            summaryUrl: itemId.url
        });
    }
}

export default translate(connect()(ShowDialInInfoButton));
