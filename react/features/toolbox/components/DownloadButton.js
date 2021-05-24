// @flow

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { translate } from '../../base/i18n';
import { IconDownload } from '../../base/icons';
import { connect } from '../../base/redux';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { openURLInBrowser } from '../../base/util';
import { isVpaasMeeting } from '../../billing-counter/functions';

type Props = AbstractButtonProps & {

    /**
     * The URL to the applications page.
     */
    _downloadAppsUrl: string
};

/**
 * Implements an {@link AbstractButton} to open the applications page in a new window.
 */
class DownloadButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.download';
    icon = IconDownload;
    label = 'toolbar.download';

    /**
     * Handles clicking / pressing the button, and opens a new window with the user documentation.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        sendAnalytics(createToolbarEvent('download.pressed'));
        openURLInBrowser(this.props._downloadAppsUrl);
    }
}


/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The redux store/state.
 * @returns {Object}
 */
function _mapStateToProps(state: Object) {
    const { downloadAppsUrl } = state['features/base/config'].deploymentUrls || {};
    const visible = typeof downloadAppsUrl === 'string' && !isVpaasMeeting(state);

    return {
        _downloadAppsUrl: downloadAppsUrl,
        visible
    };
}

export default translate(connect(_mapStateToProps)(DownloadButton));
