import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IconCloseLarge } from '../../../base/icons/svg';
import Button from '../../../base/ui/components/web/Button';
import ClickableIcon from '../../../base/ui/components/web/ClickableIcon';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';
import { hideVideoPermissionPrompt } from '../../actions.web';
import { PERMISSION_PROMPT_TITLE_ID } from '../../constants';
import { getKeySuffix } from '../../functions';
import { usePermissionPrompt } from '../../hooks.web';
import { IPermissionPrompt } from '../../reducer';

import CaptureElement from './CaptureElement';

const useStyles = makeStyles()(theme => {
    return {
        actions: {
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(2)
        },
        container: {
            backgroundColor: theme.palette.dialogBackground,
            border: `1px solid ${theme.palette.dialogBorder}`,
            borderRadius: `${theme.shape.borderRadius}px`,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(3),
            maxWidth: '100%',
            padding: '20px',
            width: '400px'
        },
        description: {
            ...theme.typography.bodyShortRegular,
            color: theme.palette.dialogSecondaryText,
            margin: 0
        },
        header: {
            alignItems: 'flex-start',
            display: 'flex',
            gap: '12px',
            justifyContent: 'space-between'
        },
        heading: {
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
        },
        row: {
            display: 'grid',
            gap: theme.spacing(2),
            gridTemplateColumns: '1fr auto'
        },
        title: {
            ...theme.typography.heading6,
            color: theme.palette.dialogText,
            margin: 0
        }
    };
});

/**
 * Explains why the camera is needed before the browser asks for access, above the camera button which the user
 * selected.
 *
 * @param {IPermissionPrompt} props - The component's props.
 * @returns {JSX.Element}
 */
const PermissionPromptPopover = ({ kinds, onDone, otherKind }: IPermissionPrompt) => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const close = useCallback(() => dispatch(hideVideoPermissionPrompt()), []);
    const { allow, allowBoth, onCaptureElementUnsupported, showCaptureElement }
        = usePermissionPrompt({ close, kinds, onDone, otherKind });
    const suffix = getKeySuffix(kinds);

    // However the popover closes, e.g. the camera settings button closed it, don't show it again with an answered
    // prompt.
    useEffect(() => () => {
        dispatch(hideVideoPermissionPrompt());
    }, []);

    // Unmounting answers no.
    const notNow = (
        <Button
            accessibilityLabel = { t('mediaPermissions.notNow') }
            labelKey = 'mediaPermissions.notNow'
            onClick = { close }
            type = { BUTTON_TYPES.TERTIARY } />
    );

    return (
        <div className = { classes.container }>
            <div className = { classes.header }>
                <div className = { classes.heading }>
                    <h2
                        className = { classes.title }
                        id = { PERMISSION_PROMPT_TITLE_ID }>
                        { t(`mediaPermissions.promptTitle${suffix}`) }
                    </h2>
                    <p className = { classes.description }>{ t(`mediaPermissions.promptDescription${suffix}`) }</p>
                </div>
                <ClickableIcon
                    accessibilityLabel = { t('dialog.accessibilityLabel.close') }
                    icon = { IconCloseLarge }
                    onClick = { close } />
            </div>
            { showCaptureElement ? (
                <div className = { classes.actions }>
                    <CaptureElement
                        kinds = { kinds }
                        onDone = { allow }
                        onUnsupported = { onCaptureElementUnsupported } />
                    { otherKind && (
                        <CaptureElement
                            kinds = { [ ...kinds, otherKind ] }
                            onDone = { allow }
                            onUnsupported = { onCaptureElementUnsupported } />
                    ) }
                    { notNow }
                </div>
            ) : (
                <div className = { classes.actions }>
                    <Button
                        accessibilityLabel = { t(`mediaPermissions.allow${suffix}`) }
                        autoFocus = { true }
                        fullWidth = { true }
                        labelKey = { `mediaPermissions.allow${suffix}` }
                        onClick = { allow } />
                    { otherKind ? (
                        <div className = { classes.row }>
                            <Button
                                accessibilityLabel = { t('mediaPermissions.allowBoth') }
                                fullWidth = { true }
                                labelKey = 'mediaPermissions.allowBoth'
                                onClick = { allowBoth }
                                type = { BUTTON_TYPES.SECONDARY } />
                            { notNow }
                        </div>
                    ) : notNow }
                </div>
            ) }
        </div>
    );
};

export default PermissionPromptPopover;
