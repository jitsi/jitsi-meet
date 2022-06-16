// @flow

import { createToolbarEvent, sendAnalytics } from '../../analytics';
import { isLocalParticipantModerator } from '../../base/participants';
import { AbstractButton, type AbstractButtonProps } from '../../base/toolbox/components';
import { maybeShowPremiumFeatureDialog } from '../../jaas/actions';
import { FEATURES } from '../../jaas/constants';
import { toggleRequestingSubtitles } from '../actions';

export type AbstractProps = AbstractButtonProps & {

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,

    /**
     * Invoked to Dispatch an Action to the redux store.
     */
    dispatch: Function,

    /**
     * Whether the local participant is currently requesting subtitles.
     */
    _requestingSubtitles: Boolean
};

/**
 * The button component which starts/stops the transcription.
 */
export class AbstractClosedCaptionButton
    extends AbstractButton<AbstractProps, *> {
    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    async _handleClick() {
        const { _requestingSubtitles, dispatch } = this.props;

        sendAnalytics(createToolbarEvent('transcribing.ccButton',
            {
                'requesting_subtitles': Boolean(_requestingSubtitles)
            }));


        const dialogShown = await dispatch(maybeShowPremiumFeatureDialog(FEATURES.RECORDING));

        if (!dialogShown) {
            dispatch(toggleRequestingSubtitles());
        }
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isDisabled() {
        return false;
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    _isToggled() {
        return this.props._requestingSubtitles;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code AbstractClosedCaptionButton} component.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component
 * instance.
 * @private
 * @returns {{
 *     _requestingSubtitles: boolean,
 *     visible: boolean
 * }}
 */
export function _abstractMapStateToProps(state: Object, ownProps: Object) {
    const { _requestingSubtitles } = state['features/subtitles'];
    const { transcribingEnabled } = state['features/base/config'];
    const { isTranscribing } = state['features/transcribing'];

    // if the participant is moderator, it can enable transcriptions and if
    // transcriptions are already started for the meeting, guests can just show them
    const { visible = Boolean(transcribingEnabled
        && (isLocalParticipantModerator(state) || isTranscribing)) } = ownProps;

    return {
        _requestingSubtitles,
        visible
    };
}
