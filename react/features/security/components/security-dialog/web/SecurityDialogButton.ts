import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n/functions';
import { toggleSecurityDialog } from '../../../actions';
import AbstractSecurityDialogButton, {
    IProps as AbstractSecurityDialogButtonProps,
    _mapStateToProps as _abstractMapStateToProps
} from '../AbstractSecurityDialogButton';

/**
 * Implements an {@link AbstractSecurityDialogButton} to open the security dialog.
 */
class SecurityDialogButton<P extends AbstractSecurityDialogButtonProps, S> extends AbstractSecurityDialogButton<P, S> {

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
