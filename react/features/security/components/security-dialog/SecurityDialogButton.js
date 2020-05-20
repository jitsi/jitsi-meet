// @flow

import { createToolbarEvent, sendAnalytics } from '../../../analytics';
import { translate } from '../../../base/i18n';
import { IconLockPassword, IconUnlockPassword } from '../../../base/icons';
import { connect } from '../../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../../base/toolbox';
import { openSecurityDialog } from '../../actions';


type Props = AbstractButtonProps & {

    /**
     * Whether the shared document is being edited or not.
     */
    _locked: boolean,

    /**
     * On click handler that opens the security dialog.
     */
    onClick: Function

};


/**
 * Implements an {@link AbstractButton} to open the security dialog.
 */
class SecurityDialogButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.security';
    icon = IconUnlockPassword;
    label = 'toolbar.security';
    toggledIcon = IconLockPassword;
    tooltip = 'toolbar.security';

    /**
     * Handles clicking / pressing the button, and opens / closes the appropriate dialog.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        sendAnalytics(createToolbarEvent('toggle.security', { enable: !this.props._locked }));
        this.props.onClick();
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._locked;
    }
}

/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The redux store/state.
 * @returns {Props}
 */
function mapStateToProps(state: Object) {
    const { locked } = state['features/base/conference'];

    return {
        _locked: locked
    };
}

/**
 * Maps dispatching of some action to React component props.
 *
 * @param {Function} dispatch - Redux action dispatcher.
 * @returns {Props}
 */
const mapDispatchToProps = {
    onClick: () => openSecurityDialog()
};

export default translate(connect(mapStateToProps, mapDispatchToProps)(SecurityDialogButton));
