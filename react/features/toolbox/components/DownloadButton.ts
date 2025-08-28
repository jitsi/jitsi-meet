import { connect } from 'react-redux';

import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import { IconDownload } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { openURLInBrowser } from '../../base/util/openURLInBrowser';

interface IProps extends AbstractButtonProps {

    /**
     * The URL to the applications page.
     */
    _downloadAppsUrl: string;
}

/**
 * Implements an {@link AbstractButton} to open the applications page in a new window.
 */
class DownloadButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.download';
    override icon = IconDownload;
    override label = 'toolbar.download';
    override tooltip = 'toolbar.download';

    /**
     * Handles clicking / pressing the button, and opens a new window with the user documentation.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { _downloadAppsUrl } = this.props;

        sendAnalytics(createToolbarEvent('download.pressed'));
        openURLInBrowser(_downloadAppsUrl);
    }
}


/**
 * Maps part of the redux state to the component's props.
 *
 * @param {Object} state - The redux store/state.
 * @returns {Object}
 */
function _mapStateToProps(state: IReduxState) {
    const { downloadAppsUrl } = state['features/base/config'].deploymentUrls || {};
    const visible = typeof downloadAppsUrl === 'string';

    return {
        _downloadAppsUrl: downloadAppsUrl ?? '',
        visible
    };
}

export default translate(connect(_mapStateToProps)(DownloadButton));
