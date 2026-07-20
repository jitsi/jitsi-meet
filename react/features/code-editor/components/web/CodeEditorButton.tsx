import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconCode } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { setOverflowMenuVisible } from '../../../toolbox/actions.web';
import { toggleCodeEditor } from '../../actions.web';
import { isCodeEditorButtonVisible, isCodeEditorOpen } from '../../functions';

interface IProps extends AbstractButtonProps {

    /**
     * Whether or not the button is toggled.
     */
    _toggled: boolean;
}

/**
 * Toolbar button that opens / closes the collaborative code editor.
 */
class CodeEditorButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.codeEditor';
    override icon = IconCode;
    override label = 'toolbar.showCodeEditor';
    override toggledLabel = 'toolbar.hideCodeEditor';
    override tooltip = 'toolbar.showCodeEditor';
    override toggledTooltip = 'toolbar.hideCodeEditor';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch } = this.props;

        dispatch(toggleCodeEditor());
        dispatch(setOverflowMenuVisible(false));
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        return this.props._toggled;
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {IReduxState} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _toggled: isCodeEditorOpen(state),
        visible: isCodeEditorButtonVisible(state)
    };
}

export default translate(connect(_mapStateToProps)(CodeEditorButton));
