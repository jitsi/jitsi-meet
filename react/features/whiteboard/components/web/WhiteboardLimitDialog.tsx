import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import Dialog from '../../../base/ui/components/web/Dialog';
import { getWhiteboardConfig } from '../../functions';

/**
 * Component that renders the whiteboard user limit dialog.
 *
 * @returns {JSX.Element}
 */
const WhiteboardLimitDialog = () => {
    const { t } = useTranslation();
    const { limitUrl } = useSelector(getWhiteboardConfig);

    return (
        <Dialog
            cancel = {{ hidden: true }}
            ok = {{ hidden: true }}
            titleKey = { t('dialog.whiteboardLimitTitle') }>
            <span>{t('dialog.whiteboardLimitContent')}</span>
            {limitUrl && (
                <span>
                    {` ${t('dialog.whiteboardLimitReference')} `}
                    <a
                        href = { limitUrl }
                        rel = 'noopener noreferrer'
                        target = '_blank'>
                        {t('dialog.whiteboardLimitReferenceUrl')}
                    </a>
                    .
                </span>
            )}
        </Dialog>
    );
};

export default WhiteboardLimitDialog;
