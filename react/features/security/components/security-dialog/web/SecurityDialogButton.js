// @flow

import { translate } from '../../../../base/i18n';
import { connect } from '../../../../base/redux';
import { toggleSecurityDialog } from '../../../actions';
import AbstractSecurityDialogButton, {
    type Props as AbstractSecurityDialogButtonProps,
    _mapStateToProps as _abstractMapStateToProps
} from '../AbstractSecurityDialogButton';

type Props = AbstractSecurityDialogButtonProps;

/**
 * Implements an {@link AbstractSecurityDialogButton} to open the security dialog.
 */
class SecurityDialogButton<P: Props, S:*> extends AbstractSecurityDialogButton<P, S> {

    /**
     * Opens / closes the security dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClickSecurityButton() {
        const { dispatch } = this.props;

        dispatch(toggleSecurityDialog());
    }
}

export default translate(connect(_abstractMapStateToProps)(SecurityDialogButton));
