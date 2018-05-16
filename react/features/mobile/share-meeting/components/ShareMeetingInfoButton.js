// @flow

import _ from 'lodash';
import { Share } from 'react-native';
import { connect } from 'react-redux';

import { getInviteURL } from '../../../base/connection';
import { translate } from '../../../base/i18n';
import { AbstractButton } from '../../../base/toolbox';
import type { AbstractButtonProps } from '../../../base/toolbox';
import { updateDialInNumbers } from '../../../invite';

type Props = AbstractButtonProps & {

    /**
     * The object representing the dialIn feature.
     */
    _dialIn: Object,

    /**
     * The current URL of the conference.
     */
    _inviteURL: string,

    /**
     * URL where the current conference is being live-streamed.
     */
    _liveStreamViewURL: ?string,

    /**
     * Handler to be executed after the sharing process finishes.
     */
    afterShare: Function,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
}

/**
 * An implementation of a button for showing the {@code ShareMenu}.
 */
class ShareMeetingInfoButton extends AbstractButton<Props, *> {
    accessibilityLabel = 'Share meeting info';
    iconName = 'icon-info';
    label = 'info.tooltip';

    /**
     * Update the dial-in numbers, if needed.
     *
     * @inheritdoc
     */
    componentDidMount() {
        this.props._dialIn.numbers
            || this.props.dispatch(updateDialInNumbers());
    }

    /**
     * Creates a message describing how to dial into the conference. Include
     * the following items, in order.
     *
     * - URL.
     * - LiveStream URL.
     * - Phone numbers.
     *
     * TODO: look into sharing this with InfoDialog on web.
     *
     * @private
     * @returns {string}
     */
    _getMeetingInfoText() {
        const { _dialIn, _inviteURL, _liveStreamViewURL, t } = this.props;
        const invite = [ t('info.inviteURL', { url: _inviteURL }) ];
        const { conferenceID, numbers, numbersEnabled } = _dialIn;

        if (_liveStreamViewURL) {
            const liveStream = t('info.inviteLiveStream', {
                url: _liveStreamViewURL
            });

            invite.push(liveStream);
        }

        if (numbersEnabled && !_.isEmpty(numbers) && conferenceID) {
            const dialInfo = [ t('info.dialANumber', { conferenceID }) ];

            for (const country of Object.keys(numbers).sort()) {
                const nums = numbers[country];

                if (Array.isArray(nums)) {
                    dialInfo.push(`- ${country}: ${nums.join(', ')}`);
                }
            }

            invite.push(dialInfo.join('\n'));
        }

        return invite.join('\n\n');
    }

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    _handleClick() {
        const message = this._getMeetingInfoText();
        const { afterShare } = this.props;

        Share.share({ message })
            .catch(reason => {
                console.error(`Failed to share meeting info: ${reason}`);
            })
            .finally(() => afterShare && afterShare());
    }
}

/**
 * Maps (parts of) the Redux state to the associated component's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {{
 *     _dialIn: Object,
 *     _inviteURL: string,
 *     _liveStreamViewURL: string
 * }}
 */
function _mapStateToProps(state) {
    // FIXME: We currently don't have any recording features implemented on
    // mobile, so nobody imports the feature, thus no reducer is registered.
    // In addition, the recording feature is split across old and new code,
    // so currently `liveStreamViewURL` is not stored. Let's get ready for when
    // it comes.
    const recordingState = state['features/recording'] || {};

    return {
        _dialIn: state['features/invite'],
        _inviteURL: getInviteURL(state),
        _liveStreamViewURL: recordingState.liveStreamViewURL
    };
}

export default translate(connect(_mapStateToProps)(ShareMeetingInfoButton));
