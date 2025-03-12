import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { MEET_FEATURES } from '../../base/jwt/constants';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { maybeShowPremiumFeatureDialog } from '../../jaas/actions';
import { canStartSubtitles } from '../functions.any';

export interface IAbstractProps extends AbstractButtonProps {

    _language: string | null;

    /**
     * Whether the local participant is currently requesting subtitles.
     */
    _requestingSubtitles: boolean;

    /**
     * Selected language for subtitle.
     */
    _subtitles: string;

    languages?: string;

    languagesHead?: string;
}

/**
 * The button component which starts/stops the transcription.
 */
export class AbstractClosedCaptionButton
    extends AbstractButton<IAbstractProps> {

    /**
     * Helper function to be implemented by subclasses, which should be used
     * to handle the closed caption button being clicked / pressed.
     *
     * @protected
     * @returns {void}
     */
    _handleClickOpenLanguageSelector() {
        // To be implemented by subclass.
    }

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    override _handleClick() {
        const { _requestingSubtitles, dispatch } = this.props;

        sendAnalytics(createToolbarEvent('transcribing.ccButton',
            {
                'requesting_subtitles': Boolean(_requestingSubtitles)
            }));

        const dialogShown = dispatch(maybeShowPremiumFeatureDialog(MEET_FEATURES.RECORDING));

        if (!dialogShown) {
            this._handleClickOpenLanguageSelector();
        }
    }

    /**
     * Indicates whether this button is disabled or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isDisabled() {
        return false;
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
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
 *     _language: string,
 *     visible: boolean
 * }}
 */
export function _abstractMapStateToProps(state: IReduxState, ownProps: IAbstractProps) {
    const { _requestingSubtitles, _language } = state['features/subtitles'];

    // if the participant is moderator, it can enable transcriptions and if
    // transcriptions are already started for the meeting, guests can just show them
    const { visible = canStartSubtitles(state) } = ownProps;

    return {
        _requestingSubtitles,
        _language,
        visible
    };
}
