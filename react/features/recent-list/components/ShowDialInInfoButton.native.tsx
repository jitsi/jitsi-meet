import { connect } from 'react-redux';

import { translate } from '../../base/i18n/functions';
import { IconInfoCircle } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { navigateRoot } from '../../mobile/navigation/rootNavigationContainerRef';
import { screen } from '../../mobile/navigation/routes';

export interface IProps extends AbstractButtonProps {

    /**
     * The ID of the entry to be deleted.
     */
    itemId: any;
}

/**
 * A recent list menu button which opens the dial-in info dialog.
 */
class ShowDialInInfoButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'welcomepage.info';
    override icon = IconInfoCircle;
    override label = 'welcomepage.info';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { itemId } = this.props;

        navigateRoot(screen.dialInSummary, {
            summaryUrl: itemId.url
        });
    }
}

export default translate(connect()(ShowDialInInfoButton));
