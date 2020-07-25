// @flow

import { connect } from '../../base/redux';
import AbstractFollowMeButton from '../../base/toolbox/components/AbstractFollowMeButton';
import type { AbstractButtonProps } from '../../base/toolbox';
import { isLocalParticipantModerator } from '../../base/participants';
import { translate } from '../../base/i18n';
import { setFollowMe } from '../../base/conference';

/**
 * The type of the React {@code Component} props of {@link FollowMeButton}.
 */
type Props = AbstractButtonProps & {

    /**
     * Follow me enabled
     */
    _followMeEnabled: boolean,

    /**
     * If local participant is moderator
     */
    _isModerator: boolean,

    /**
     * If local participant is moderator
     */
    visible: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function
}

/**
 * Component that renders a toolbar button for toggling audio mute.
 *
 * @extends AbstractFollowMeButton
 */
class FollowMeButton extends AbstractFollowMeButton<Props, *> {
    accessibilityLabel = 'toolbar.accessibilityLabel.follow';
    label = 'toolbar.follow';
    tooltip = 'toolbar.follow';

    // eslint-disable-next-line no-useless-constructor,require-jsdoc
    constructor(props: Props) {
        super(props);
    }

    /**
     * Indicates if audio is currently muted ot nor.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isFollowMeEnabled() {
        return this.props._followMeEnabled;
    }

    /**
     * Changes the muted state.
     *
     * @param {boolean} followMeEnabled - followMeEnabled
     * @protected
     * @returns {void}
     */
    _setFollowMe(followMeEnabled: boolean) {
        this.props.dispatch(setFollowMe(followMeEnabled));
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code FollowMeButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _followMeEnabled: boolean,
 *     _isModerator: boolean
 * }}
 */
function _mapStateToProps(state): Object {
    const _followMeEnabled = state['features/base/conference'].followMeEnabled;
    const _isModerator = isLocalParticipantModerator(state);

    return {
        _followMeEnabled,
        _isModerator,
        visible: _isModerator
    };
}

export default translate(connect(_mapStateToProps)(FollowMeButton));
