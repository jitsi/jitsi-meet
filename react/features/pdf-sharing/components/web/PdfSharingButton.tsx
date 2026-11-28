import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconShareDoc } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { setOverflowMenuVisible } from '../../../toolbox/actions.web';
import { resetPdfPresentation, stopPdfPresentation } from '../../actions';
import { isPdfPresentationOpen, isPdfSharingButtonVisible } from '../../functions';

interface IProps extends AbstractButtonProps {
    _isPdfOpen: boolean;
}

/**
 * Component that renders a toolbar button for PDF presentation sharing.
 */
class PdfSharingButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.pdfSharing';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.stopPdfSharing';
    override icon = IconShareDoc;
    override label = 'toolbar.pdfSharing';
    override toggledLabel = 'toolbar.stopPdfSharing';
    override tooltip = 'toolbar.pdfSharing';
    override toggledTooltip = 'toolbar.stopPdfSharing';

    /**
     * Handles clicking the button.
     */
    override _handleClick() {
        const { dispatch, _isPdfOpen } = this.props;

        dispatch(setOverflowMenuVisible(false));

        if (_isPdfOpen) {
            dispatch(stopPdfPresentation());

            return;
        }

        // Trigger file input dialog to select a PDF
        const fileInput = document.createElement('input');

        fileInput.type = 'file';
        fileInput.accept = 'application/pdf,.pdf';
        fileInput.style.display = 'none';

        fileInput.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target?.files?.[0];

            if (file) {
                const objectUrl = URL.createObjectURL(file);
                const { startPdfPresentation } = require('../../actions');

                dispatch(startPdfPresentation(objectUrl, file.name));
            }
            document.body.removeChild(fileInput);
        };

        document.body.appendChild(fileInput);
        fileInput.click();
    }

    /**
     * Indicates whether this button is in toggled state.
     */
    override _isToggled() {
        return this.props._isPdfOpen;
    }
}

function _mapStateToProps(state: IReduxState) {
    return {
        _isPdfOpen: isPdfPresentationOpen(state),
        visible: isPdfSharingButtonVisible(state)
    };
}

export default translate(connect(_mapStateToProps)(PdfSharingButton));
