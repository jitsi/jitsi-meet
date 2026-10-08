import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import ExpandedLabel, { IProps as AbstractProps } from '../../../base/label/components/native/ExpandedLabel';
import { isTranslationPlayingOut } from '../../functions';

interface IProps extends AbstractProps, WithTranslation {

    /**
     * Whether a speaker's translated audio is still playing out.
     */
    _playingOut: boolean;
}

/**
 * A tooltip-like expanded label explaining the meaning of the audio-translation conference label.
 */
class TranslationExpandedLabel extends ExpandedLabel<IProps> {

    /**
     * Returns the label specific text of this {@code ExpandedLabel}.
     *
     * @returns {string}
     */
    _getLabel() {
        const { _playingOut, t } = this.props;

        return t(_playingOut ? 'audioTranslation.labelTooltipPlaying' : 'audioTranslation.labelTooltip');
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code TranslationExpandedLabel}'s props.
 *
 * @param {IReduxState} state - The Redux state.
 * @private
 * @returns {{
 *     _playingOut: boolean
 * }}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _playingOut: isTranslationPlayingOut(state)
    };
}

export default translate(connect(_mapStateToProps)(TranslationExpandedLabel));
