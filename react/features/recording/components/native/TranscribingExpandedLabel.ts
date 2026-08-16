import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import ExpandedLabel, { IProps as AbstractProps } from '../../../base/label/components/native/ExpandedLabel';
import { isRecorderTranscriptionsRunning } from '../../../transcribing/functions';

interface IProps extends AbstractProps, WithTranslation {

    /**
     * Whether this meeting is being transcribed.
     */
    _isTranscribing?: boolean;
}

/**
 * A react {@code Component} that implements an expanded label as tooltip-like
 * component to explain the meaning of the {@code TranscribingLabel}.
 */
class TranscribingExpandedLabel extends ExpandedLabel<IProps> {

    /**
     * Returns the label specific text of this {@code ExpandedLabel}.
     *
     * @returns {string}
     */
    _getLabel() {
        const { _isTranscribing, t } = this.props;

        if (_isTranscribing) {
            return t('transcribing.labelTooltip');
        }

        return t('transcribing.expandedOff');
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code TranscribingExpandedLabel}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _isTranscribing: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _isTranscribing: isRecorderTranscriptionsRunning(state)
    };
}

export default translate(connect(_mapStateToProps)(TranscribingExpandedLabel));
