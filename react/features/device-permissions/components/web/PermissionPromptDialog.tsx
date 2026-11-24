import { alpha } from '@mui/material/styles';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { hideDialog } from '../../../base/dialog/actions';
import Icon from '../../../base/icons/components/Icon';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';
import { DEVICE_ICONS } from '../../constants';
import { CaptureKind, getKeySuffix } from '../../functions';
import { usePermissionPrompt } from '../../hooks.web';
import { IPermissionPrompt } from '../../reducer';

import CaptureElement from './CaptureElement';
import PermissionDialog from './PermissionDialog';

interface IProps extends IPermissionPrompt {

    /**
     * Whether the user is unmuting a device, as opposed to joining.
     */
    whenUnmuting: boolean;
}

const useStyles = makeStyles()(theme => {
    const badgeColor = alpha(theme.palette.action01, 0.2);

    return {
        badge: {
            alignItems: 'center',
            backgroundColor: theme.palette.dialogBackground,

            // Opaque, so that the overlapping badge hides the one under it.
            backgroundImage: `linear-gradient(${badgeColor}, ${badgeColor})`,
            border: `2px solid ${theme.palette.dialogBackground}`,
            borderRadius: '50%',
            boxSizing: 'border-box',
            display: 'flex',
            height: '44px',
            justifyContent: 'center',
            width: '44px',

            '& + &': {
                marginLeft: '-10px'
            }
        },
        badges: {
            display: 'flex'
        }
    };
});

/**
 * Explains why the microphone or the camera is needed before the browser asks for access.
 *
 * @param {IProps} props - The component's props.
 * @returns {JSX.Element}
 */
const PermissionPromptDialog = ({ kinds, onDone, otherKind, whenUnmuting }: IProps) => {
    const { classes, theme } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const close = useCallback(() => dispatch(hideDialog()), []);
    const { allow, allowBoth, cancel, onCaptureElementUnsupported, showCaptureElement }
        = usePermissionPrompt({ close, kinds, onDone, otherKind });
    const suffix = getKeySuffix(kinds);
    const dismissKey = whenUnmuting ? 'mediaPermissions.notNow' : `mediaPermissions.continueWithout${suffix}`;

    const dismiss = useCallback(() => {
        close();
        cancel();
    }, [ cancel, close ]);

    const badges = (
        <div className = { classes.badges }>
            { ([ 'audio', 'video' ] as CaptureKind[]).filter(kind => kinds.includes(kind)).map(kind => (
                <div
                    className = { classes.badge }
                    key = { kind }>
                    <Icon
                        color = { theme.palette.action01 }
                        size = { 20 }
                        src = { DEVICE_ICONS[kind] } />
                </div>
            )) }
        </div>
    );

    return (
        <PermissionDialog
            actions = {
                <>
                    { showCaptureElement ? (
                        <>
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
                        </>
                    ) : (
                        <>
                            <Button
                                accessibilityLabel = { t(`mediaPermissions.allow${suffix}`) }
                                fullWidth = { true }
                                icon = { whenUnmuting ? DEVICE_ICONS[kinds[0]] : undefined }
                                labelKey = { `mediaPermissions.allow${suffix}` }
                                onClick = { allow } />
                            { otherKind && (
                                <Button
                                    accessibilityLabel = { t('mediaPermissions.allowBoth') }
                                    fullWidth = { true }
                                    icon = { DEVICE_ICONS[otherKind] }
                                    labelKey = 'mediaPermissions.allowBoth'
                                    onClick = { allowBoth }
                                    type = { BUTTON_TYPES.SECONDARY } />
                            ) }
                        </>
                    ) }
                    <Button
                        accessibilityLabel = { t(dismissKey) }
                        fullWidth = { true }
                        labelKey = { dismissKey }
                        onClick = { dismiss }
                        type = { BUTTON_TYPES.TERTIARY } />
                </>
            }
            description = { t(`mediaPermissions.promptDescription${suffix}`) }
            header = { badges }
            onClose = { cancel }
            title = { t(`mediaPermissions.promptTitle${suffix}`) } />
    );
};

export default PermissionPromptDialog;
