import { alpha } from '@mui/material/styles';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { hideDialog } from '../../../base/dialog/actions';
import Button from '../../../base/ui/components/web/Button';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';
import {
    CaptureKind,
    getBlockedGuide,
    getBrowserNames,
    getCaptureElement,
    getKeySuffix,
    getSystemSettingsUrl,
    openSystemSettings,
    requestAccess
} from '../../functions';

import BlockedGuide from './BlockedGuide';
import CaptureElement from './CaptureElement';
import PermissionDialog from './PermissionDialog';

interface IProps {

    /**
     * The blocked devices.
     */
    kinds: CaptureKind[];

    /**
     * Requests the devices again.
     */
    onRetry: () => void;
}

const useStyles = makeStyles()(theme => {
    return {
        browserPill: {
            backgroundColor: alpha(theme.palette.actionDanger, 0.16),
            color: theme.palette.textError,

            '&::before': {
                backgroundColor: theme.palette.actionDanger
            }
        },
        embedded: {
            ...theme.typography.labelRegular,
            color: theme.palette.text03,
            margin: 0
        },
        osPill: {
            backgroundColor: alpha(theme.palette.warning01, 0.14),
            color: theme.palette.warning01,

            '&::before': {
                backgroundColor: theme.palette.warning01
            }
        },
        pill: {
            ...theme.typography.labelBold,
            alignItems: 'center',
            borderRadius: '999px',
            display: 'inline-flex',
            gap: '6px',
            padding: '4px 10px',

            '&::before': {
                borderRadius: '50%',
                content: '""',
                height: '6px',
                width: '6px'
            }
        },
        retrying: {
            ...theme.typography.labelRegular,
            alignItems: 'center',
            color: theme.palette.text03,
            display: 'flex',
            gap: theme.spacing(2),

            '&::before': {
                backgroundColor: theme.palette.action01,
                borderRadius: '50%',
                boxShadow: `0 0 0 4px ${alpha(theme.palette.action01, 0.2)}`,
                content: '""',
                flex: 'none',
                height: '6px',
                width: '6px'
            }
        },
        row: {
            display: 'flex',
            gap: theme.spacing(2)
        },
        rowMain: {
            flex: 1
        }
    };
});

/**
 * Guides the user through unblocking the microphone or the camera, in the browser or in the OS.
 *
 * @param {IProps} props - The component's props.
 * @returns {JSX.Element}
 */
const PermissionBlockedDialog = ({ kinds, onRetry }: IProps) => {
    const { classes, cx } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const statuses = useSelector((state: IReduxState) => state['features/base/devices'].permissionStatus);
    const guide = getBlockedGuide(kinds.map(kind => statuses?.[kind]?.reason));
    const isBrowserBlock = guide.startsWith('browser');
    const isOsBlock = guide.startsWith('os');
    const isEmbedded = window.self !== window.top;
    const osBlocked = kinds.find(kind => statuses?.[kind]?.reason === 'os') ?? kinds[0];
    const settingsUrl = isOsBlock ? getSystemSettingsUrl(osBlocked) : undefined;
    const browserName = getBrowserNames()?.name;

    // Brave has the capability elements, but they don't lift a block.
    const [ isCaptureElementSupported, setCaptureElementSupported ]
        = useState(() => browserName !== 'Brave' && Boolean(getCaptureElement(kinds)));
    const showCaptureElement = isBrowserBlock && isCaptureElementSupported;
    const domain = window.location.host;
    const device = t(`mediaPermissions.device${getKeySuffix(kinds)}`);
    let titleKey = `mediaPermissions.blocked.${guide}.title`;
    let description;

    if (guide === 'osMac' && !browserName) {
        titleKey = 'mediaPermissions.blocked.osMac.titleGeneric';
    } else if (guide === 'policy') {
        // Only the page's own settings, or the site that embeds it, can lift the block.
        titleKey = `mediaPermissions.blocked.policy.title${isEmbedded ? 'Embedded' : ''}`;
        description = t(`mediaPermissions.blocked.policy.description${isEmbedded ? 'Embedded' : ''}`);
    } else if (showCaptureElement) {
        description = t('mediaPermissions.blocked.captureElement', { domain });
    }

    const close = useCallback(() => dispatch(hideDialog()), []);

    const onTryAgain = useCallback(() => {
        close();
        onRetry();
    }, [ close, onRetry ]);

    const settingsKey = `mediaPermissions.${guide === 'osMac' ? 'openSystemSettings' : 'openWindowsSettings'}`;
    const onOpenSettings = useCallback(() => settingsUrl && openSystemSettings(settingsUrl), [ settingsUrl ]);
    const onCaptureElementUnsupported = useCallback(() => setCaptureElementSupported(false), []);

    // Retry once the user unblocked the devices, the Permissions API reports it on most browsers.
    const granted = kinds.every(kind => statuses?.[kind]?.state === 'granted');

    useEffect(() => {
        granted && onTryAgain();
    }, [ granted ]);

    // The Permissions API doesn't report a change in the Windows settings, so check again when the user comes back
    // from them. A request that gets the devices reports them as granted, which retries.
    useEffect(() => {
        if (guide !== 'osWindows') {
            return;
        }

        const check = () => requestAccess(kinds);

        window.addEventListener('focus', check);

        return () => window.removeEventListener('focus', check);
    }, [ guide ]);

    const tryAgainButton = (type: BUTTON_TYPES, fullWidth = true) => (
        <Button
            accessibilityLabel = { t('mediaPermissions.tryAgain') }
            fullWidth = { fullWidth }
            labelKey = 'mediaPermissions.tryAgain'
            onClick = { onTryAgain }
            type = { type } />
    );

    let actions;

    if (guide === 'policy') {
        actions = (
            <Button
                accessibilityLabel = { t('dialog.Ok') }
                fullWidth = { true }
                labelKey = 'dialog.Ok'
                onClick = { close } />
        );
    } else if (showCaptureElement) {
        actions = (
            <>
                <CaptureElement
                    kinds = { kinds }
                    onDone = { onTryAgain }
                    onUnsupported = { onCaptureElementUnsupported } />
                <Button
                    accessibilityLabel = { t('mediaPermissions.notNow') }
                    fullWidth = { true }
                    labelKey = 'mediaPermissions.notNow'
                    onClick = { close }
                    type = { BUTTON_TYPES.TERTIARY } />
            </>
        );
    } else if (settingsUrl) {
        actions = (
            <>
                <div className = { classes.row }>
                    <Button
                        accessibilityLabel = { t(settingsKey) }
                        className = { classes.rowMain }
                        labelKey = { settingsKey }
                        onClick = { onOpenSettings } />
                    { tryAgainButton(BUTTON_TYPES.SECONDARY, false) }
                </div>
                { guide === 'osWindows' && (
                    <div className = { classes.retrying }>{ t('mediaPermissions.blocked.autoContinue') }</div>
                ) }
            </>
        );
    } else {
        actions = tryAgainButton(BUTTON_TYPES.PRIMARY);
    }

    return (
        <PermissionDialog
            actions = { actions }
            description = { description }
            header = {
                <span className = { cx(classes.pill, isOsBlock ? classes.osPill : classes.browserPill) }>
                    { t(`mediaPermissions.blocked.${guide}.pill`) }
                </span>
            }
            title = { t(titleKey, {
                browser: browserName,
                device
            }) }>
            { guide !== 'policy' && !showCaptureElement && (
                <BlockedGuide
                    guide = { guide }
                    kinds = { kinds } />
            ) }
            { isBrowserBlock && isEmbedded && (
                <p className = { classes.embedded }>{ t('mediaPermissions.blocked.embedded', { domain }) }</p>
            ) }
        </PermissionDialog>
    );
};

export default PermissionBlockedDialog;
