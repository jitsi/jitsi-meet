import { useSelector } from 'react-redux';

import PdfSharingButton from './components/web/PdfSharingButton';
import { isPdfSharingButtonVisible } from './functions';

const pdfSharing = {
    key: 'pdfsharing',
    Content: PdfSharingButton,
    group: 3
};

/**
 * A hook that returns the PDF sharing toolbar button if it is enabled.
 */
export function usePdfSharingButton() {
    const isVisible = useSelector(isPdfSharingButtonVisible);

    if (isVisible) {
        return pdfSharing;
    }
}
