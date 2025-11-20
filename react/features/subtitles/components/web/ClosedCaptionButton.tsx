import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconSubtitles } from '../../../base/icons/svg';
import { openCCPanel } from '../../../chat/actions.any';
import { toggleLanguageSelectorDialog } from '../../actions.web';
import { canStartSubtitles, isCCTabEnabled } from '../../functions.any';
import {
    AbstractClosedCaptionButton,
    IAbstractProps,
    _abstractMapStateToProps
} from '../AbstractClosedCaptionButton';

/**
 * A button which starts/stops the transcriptions.
 */
class ClosedCaptionButton
    extends AbstractClosedCaptionButton {
    override icon = IconSubtitles;
    override labelProps = {
        language: this.props.t(this.props._language ?? 'transcribing.subtitlesOff'),
        languages: this.props.t(this.props.languages ?? ''),
        languagesHead: this.props.t(this.props.languagesHead ?? '')
    };

    /**
     * Gets the current button label based on the CC tab state.
     *
     * @returns {void}
     */
    override _getLabel() {
        const { _isCCTabEnabled } = this.props;

        return _isCCTabEnabled ? 'toolbar.closedCaptions' : 'toolbar.startSubtitles';
    }

    /**
     * Returns the accessibility label for the button.
     *
     * @returns {string} Accessibility label.
     */
    override _getAccessibilityLabel() {
        const { _isCCTabEnabled } = this.props;

        return _isCCTabEnabled ? 'toolbar.accessibilityLabel.closedCaptions' : 'toolbar.accessibilityLabel.cc';
    }

    /**
     * Returns the tooltip text based on the CC tab state.
     *
     * @returns {string} The tooltip text.
     */
    override _getTooltip() {
        const { _isCCTabEnabled } = this.props;

        return _isCCTabEnabled ? 'transcribing.openClosedCaptions' : 'transcribing.ccButtonTooltip';
    }

    /**
     * Toggle language selection dialog.
     *
     * @returns {void}
     */
    override _handleClickOpenLanguageSelector() {
        const { dispatch, _isCCTabEnabled } = this.props;

        if (_isCCTabEnabled) {
            dispatch(openCCPanel());
        } else {
            dispatch(toggleLanguageSelectorDialog());
        }
    }
}

/**
 * Maps redux state to component props.
 *
 * @param {Object} state - The redux state.
 * @param {Object} ownProps - The component's own props.
 * @returns {Object} Mapped props for the component.
 */
function mapStateToProps(state: IReduxState, ownProps: IAbstractProps) {
    const { visible = canStartSubtitles(state) || isCCTabEnabled(state) } = ownProps;

    return _abstractMapStateToProps(state, {
        ...ownProps,
        visible
    });
}

export default translate(connect(mapStateToProps)(ClosedCaptionButton));
