import { connect } from "react-redux";

import { IReduxState } from "../../app/types";
import { translate } from "../../base/i18n/functions";
import { IconPip } from "../../base/icons/svg";
import AbstractButton, { IProps as AbstractButtonProps } from "../../base/toolbox/components/AbstractButton";
import { toggleDocumentPiP } from "../actions";
import { isDocumentPiPSupported } from "../functions";

interface IProps extends AbstractButtonProps {
    /**
     * Whether Document PiP is currently active.
     */
    _isActive?: boolean;
}

/**
 * Toolbar button for toggling Document Picture-in-Picture mode.
 * Only visible when the Document PiP API is supported (Chromium 116+).
 */
class DocumentPiPButton extends AbstractButton<IProps> {
    override accessibilityLabel = "toolbar.accessibilityLabel.documentPip";
    override label = "toolbar.documentPip";
    override tooltip = "toolbar.documentPip";
    override icon = IconPip;

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        return this.props._isActive;
    }

    /**
     * Handles clicking the button — toggles Document PiP window.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch } = this.props;

        dispatch(toggleDocumentPiP());
    }
}

/**
 * Maps parts of Redux state to component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
const mapStateToProps = (state: IReduxState) => {
    return {
        _isActive: state["features/document-pip"]?.isActive,
        visible: isDocumentPiPSupported(),
    };
};

export default translate(connect(mapStateToProps)(DocumentPiPButton));
