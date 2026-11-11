import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { hideDialog } from '../../../base/dialog/actions';
import { isMacOS, isWindows } from '../../../base/environment/environment';
import { browser } from '../../../base/lib-jitsi-meet';
import Dialog from '../../../base/ui/components/web/Dialog';
import { CaptureKind, getCaptureElement, getSystemSettingsUrl, openSystemSettings } from '../../functions';

import CaptureElement from './CaptureElement';

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

/**
 * The number of steps of each guide, their texts are {@code mediaPermissions.steps.<guide>.<step>}.
 */
const STEPS = {
    browserChromium: 2,
    browserFirefox: 2,
    browserSafari: 2,
    osMac: 3,
    osOther: 1,
    osWindows: 2
};

type Guide = keyof typeof STEPS;

const useStyles = makeStyles()(theme => {
    return {
        steps: {
            margin: `${theme.spacing(3)} 0 0`,
            paddingLeft: theme.spacing(4),

            '& li': {
                marginBottom: theme.spacing(2)
            }
        },
        control: {
            marginTop: theme.spacing(2)
        }
    };
});

/**
 * Returns the guide for the browser or the OS that blocks the devices.
 *
 * @param {boolean} isOsBlock - Whether the OS blocks the devices.
 * @returns {Guide}
 */
function getGuide(isOsBlock: boolean): Guide {
    if (isOsBlock) {
        if (isMacOS()) {
            return 'osMac';
        }

        return isWindows() ? 'osWindows' : 'osOther';
    }
    if (browser.isFirefox()) {
        return 'browserFirefox';
    }

    return browser.isSafari() ? 'browserSafari' : 'browserChromium';
}

/**
 * Guides the user through unblocking the microphone or the camera, in the browser or in the OS.
 *
 * @param {IProps} props - The component's props.
 * @returns {JSX.Element}
 */
const PermissionBlockedDialog = ({ kinds, onRetry }: IProps) => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const statuses = useSelector((state: IReduxState) => state['features/base/devices'].permissionStatus);
    const isOsBlock = kinds.some(kind => statuses?.[kind]?.reason === 'os');
    const guide = getGuide(isOsBlock);
    const osBlocked = kinds.find(kind => statuses?.[kind]?.reason === 'os') ?? kinds[0];
    const settingsUrl = isOsBlock ? getSystemSettingsUrl(osBlocked) : undefined;
    const [ isElementSupported, setElementSupported ] = useState(() => Boolean(getCaptureElement(kinds)));
    const useElement = !isOsBlock && isElementSupported;
    let suffix = 'Both';

    if (kinds.length === 1) {
        suffix = kinds[0] === 'audio' ? 'Audio' : 'Video';
    }

    const params = {
        device: t(`mediaPermissions.device${suffix}`),
        domain: window.location.host,
        pane: t(`mediaPermissions.pane${suffix}`)
    };

    const onTryAgain = useCallback(() => {
        dispatch(hideDialog());
        onRetry();
    }, [ onRetry ]);

    const onOpenSettings = useCallback(() => settingsUrl && openSystemSettings(settingsUrl), [ settingsUrl ]);
    const onElementUnsupported = useCallback(() => setElementSupported(false), []);

    // Retry once the user unblocked the devices, the Permissions API reports it on most browsers.
    const granted = kinds.every(kind => statuses?.[kind]?.state === 'granted');

    useEffect(() => {
        granted && onTryAgain();
    }, [ granted ]);

    return (
        <Dialog
            back = {{
                hidden: !settingsUrl,
                onClick: onOpenSettings,
                translationKey: isMacOS() ? 'mediaPermissions.openSystemSettings' : 'mediaPermissions.openSettings'
            }}
            cancel = {{ translationKey: 'dialog.close' }}
            disableAutoHideOnSubmit = { true }
            ok = {{ translationKey: 'mediaPermissions.tryAgain' }}
            onSubmit = { onTryAgain }
            title = { t(`mediaPermissions.blockedTitle${isOsBlock ? guide.slice(2) : 'Browser'}`, params) }>
            <ol className = { classes.steps }>
                { Array.from({ length: STEPS[guide] }, (_, i) => (
                    <li key = { i }>{ t(`mediaPermissions.steps.${guide}.${i + 1}`, params) }</li>
                )) }
            </ol>
            { !isOsBlock && window.self !== window.top && (
                <div>{ t('mediaPermissions.embedded', params) }</div>
            ) }
            { useElement && (
                <div className = { classes.control }>
                    <CaptureElement
                        kinds = { kinds }
                        onDone = { onTryAgain }
                        onUnsupported = { onElementUnsupported } />
                </div>
            ) }
        </Dialog>
    );
};

export default PermissionBlockedDialog;
