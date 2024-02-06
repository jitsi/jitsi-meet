import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextStyle } from 'react-native';
import { useSelector } from 'react-redux';

import ConfirmDialog from '../../../base/dialog/components/native/ConfirmDialog';
import Link from '../../../base/react/components/native/Link';
import { getWhiteboardConfig } from '../../functions';

import styles from './styles';

/**
 * Component that renders the whiteboard user limit dialog.
 *
 * @returns {JSX.Element}
 */
const WhiteboardLimitDialog = () => {
    const { t } = useTranslation();
    const { limitUrl } = useSelector(getWhiteboardConfig);

    return (
        <ConfirmDialog
            cancelLabel = { 'dialog.Ok' }
            descriptionKey = { 'dialog.whiteboardLimitContent' }
            isConfirmHidden = { true }
            title = { 'dialog.whiteboardLimitTitle' }>
            {limitUrl && (
                <Text style = { styles.limitUrlText as TextStyle }>
                    {` ${t('dialog.whiteboardLimitReference')}
`}
                    <Link
                        style = { styles.limitUrl }
                        url = { limitUrl }>
                        {t('dialog.whiteboardLimitReferenceUrl')}
                    </Link>
                    .
                </Text>
            )}
        </ConfirmDialog>
    );
};

export default WhiteboardLimitDialog;
