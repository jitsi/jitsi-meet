import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import ExpandedLabel, { IProps as AbstractProps } from '../../../base/label/components/native/ExpandedLabel';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { getSessionStatusToShow } from '../../functions';

interface IProps extends AbstractProps {

    /**
     * Whether this meeting is being transcribed.
     */
    _isTranscribing: boolean;

    /**
     * The status of the highermost priority session.
     */
    _status?: string;

    /**
     * The recording mode this indicator should display.
     */
    mode: string;

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function;
}

/**
 * A react {@code Component} that implements an expanded label as tooltip-like
 * component to explain the meaning of the {@code RecordingLabel}.
 */
class RecordingExpandedLabel extends ExpandedLabel<IProps> {

    /**
     * Returns the label specific text of this {@code ExpandedLabel}.
     *
     * @returns {string}
     */
    _getLabel() {
        const { _status, mode, t } = this.props;
        let postfix = 'recording', prefix = 'expandedOn'; // Default values.

        switch (mode) {
        case JitsiRecordingConstants.mode.STREAM:
            prefix = 'liveStreaming';
            break;
        case JitsiRecordingConstants.mode.FILE:
            prefix = 'recording';
            break;
        }

        switch (_status) {
        case JitsiRecordingConstants.status.OFF:
            postfix = 'expandedOff';
            break;
        case JitsiRecordingConstants.status.PENDING:
            postfix = 'expandedPending';
            break;
        case JitsiRecordingConstants.status.ON:
            postfix = 'expandedOn';
            break;
        }

        let content = t(`${prefix}.${postfix}`);

        if (_status === JitsiRecordingConstants.status.ON && this.props._isTranscribing) {
            content += ` \u00B7 ${t('transcribing.labelToolTip')}`;
        }

        return content;
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code RecordingExpandedLabel}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {IProps} ownProps - The component's own props.
 * @private
 * @returns {{
 *     _status: ?string
 * }}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { mode } = ownProps;

    return {
        _isTranscribing: state['features/transcribing'].isTranscribing,
        _status: getSessionStatusToShow(state, mode)
    };
}

export default translate(connect(_mapStateToProps)(RecordingExpandedLabel));
