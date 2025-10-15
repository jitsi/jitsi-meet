import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconDownload } from '../../../base/icons/svg';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { downloadMeetingData } from '../../functions.web';

/**
 * The type of the React {@code Component} props of {@link DownloadDataButton}.
 */
interface IProps extends WithTranslation {
    _room?: string;
    _state: IReduxState;
    _visible: boolean;
    dispatch: IStore['dispatch'];
}

class DownloadDataButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.downloadDataTooltip';
    override icon = IconDownload;
    override label = 'toolbar.accessibilityLabel.downloadData';
    override tooltip = 'toolbar.accessibilityLabel.downloadDataTooltip';

    /**
     * Handles clicking the button, and downloads the data.
     *
     * @returns {void}
     */
    override _handleClick() {
        downloadMeetingData(this.props._state);
    }

    /**
     * Overrides the parent's render method to hide the button if not visible.
     *
     * @returns {React.ReactNode|null}
     */
    override render() {
        return this.props._visible ? super.render() : null;
    }
}

/**
 * Maps (parts of) the Redux state to the associated props.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {Object} The mapped props.
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _visible: isLocalParticipantModerator(state),
        _room: state['features/base/conference']?.room,
        _state: state
    };
}

export default translate(connect(_mapStateToProps)(DownloadDataButton));
