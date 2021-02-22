// @flow

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { IconHelp } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { openURLInBrowser } from '../../base/util';


type Props = AbstractButtonProps & {

    /**
     * The URL to the user documenation.
     */
    _userDocumentationURL: string
};

/**
 * Implements an {@link AbstractButton} to open the user documentation in a new window.
 */
class HelpButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.help';
    icon = IconHelp;
    label = 'toolbar.help';

    /**
     * Handles clicking / pressing the button, and opens a new window with the user documentation.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        sendAnalytics(createToolbarEvent('help.pressed'));
        openURLInBrowser(this.props._userDocumentationURL);
    }
}


/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The redux store/state.
 * @returns {Object}
 */
function _mapStateToProps(state: Object) {
    const { userDocumentationURL } = state['features/base/config'].deploymentUrls || {};
    const visible = typeof userDocumentationURL === 'string';

    return {
        _userDocumentationURL: userDocumentationURL,
        visible
    };
}

export default translate(connect(_mapStateToProps)(HelpButton));
