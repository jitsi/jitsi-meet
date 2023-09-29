import { connect } from 'react-redux';

import { translate } from '../../../../base/i18n/functions';
import { navigate } from '../../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { screen } from '../../../../mobile/navigation/routes';
import AbstractSecurityDialogButton, {
    IProps as AbstractSecurityDialogButtonProps,
    _mapStateToProps as _abstractMapStateToProps
} from '../AbstractSecurityDialogButton';

/**
 * Implements an {@link AbstractSecurityDialogButton} to open the security screen.
 */
class SecurityDialogButton<P extends AbstractSecurityDialogButtonProps, S> extends AbstractSecurityDialogButton<P, S> {

    /**
     * Opens / closes the security screen.
     *
     * @private
     * @returns {void}
     */
    _handleClickSecurityButton() {
        navigate(screen.conference.security);
    }
}

export default translate(connect(_abstractMapStateToProps)(SecurityDialogButton));
