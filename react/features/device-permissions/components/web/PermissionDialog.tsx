import React, { ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { hideDialog } from '../../../base/dialog/actions';
import { IconCloseLarge } from '../../../base/icons/svg';
import BaseDialog from '../../../base/ui/components/web/BaseDialog';
import ClickableIcon from '../../../base/ui/components/web/ClickableIcon';

interface IProps {

    /**
     * The buttons, stacked at the bottom.
     */
    actions: ReactNode;

    /**
     * The content below the title, e.g. the steps.
     */
    children?: ReactNode;

    /**
     * The text below the title.
     */
    description?: string;

    /**
     * Shown next to the close button: the devices asked for, or where they are blocked.
     */
    header: ReactNode;

    /**
     * Invoked when the dialog is closed without an answer.
     */
    onClose?: () => void;

    /**
     * The title.
     */
    title: string;
}

const useStyles = makeStyles()(theme => {
    return {
        actions: {
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(2)
        },
        content: {
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            padding: theme.spacing(4)
        },
        description: {
            ...theme.typography.bodyLongRegular,
            color: theme.palette.dialogSecondaryText,
            margin: 0
        },
        header: {
            alignItems: 'center',
            display: 'flex',
            justifyContent: 'space-between'
        },
        heading: {
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(2)
        },
        title: {
            ...theme.typography.heading5,
            color: theme.palette.dialogText,
            margin: 0
        }
    };
});

/**
 * The layout shared by the dialogs about the microphone and camera access, with the buttons stacked so that their
 * labels don't wrap.
 *
 * @param {IProps} props - The component's props.
 * @returns {JSX.Element}
 */
const PermissionDialog = ({ actions, children, description, header, onClose, title }: IProps) => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const close = useCallback(() => {
        dispatch(hideDialog());
        onClose?.();
    }, [ onClose ]);

    return (
        <BaseDialog

            // The focused button handles Enter itself.
            disableEnter = { true }
            onClose = { close }
            title = { title }>
            <div className = { classes.content }>
                <div className = { classes.header }>
                    { header }
                    <ClickableIcon
                        accessibilityLabel = { t('dialog.accessibilityLabel.close') }
                        icon = { IconCloseLarge }
                        id = 'modal-header-close-button'
                        onClick = { close } />
                </div>
                <div className = { classes.heading }>
                    <h1
                        className = { classes.title }
                        id = 'dialog-title'>
                        { title }
                    </h1>
                    { description && <p className = { classes.description }>{ description }</p> }
                </div>
                { children }
                <div
                    className = { classes.actions }
                    data-autofocus-inside = 'true'>
                    { actions }
                </div>
            </div>
        </BaseDialog>
    );
};

export default PermissionDialog;
