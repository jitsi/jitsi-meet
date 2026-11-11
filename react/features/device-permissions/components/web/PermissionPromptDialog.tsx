import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { hideDialog } from '../../../base/dialog/actions';
import JitsiMeetJS from '../../../base/lib-jitsi-meet';
import Dialog from '../../../base/ui/components/web/Dialog';
import { CaptureKind, getCaptureElement } from '../../functions';

import CaptureElement from './CaptureElement';

interface IProps {

    /**
     * The devices about to be requested.
     */
    kinds: CaptureKind[];

    /**
     * Invoked with whether to go ahead with the request.
     */
    onDone: (allowed: boolean) => void;

    /**
     * The other device, offered when unmuting one of them.
     */
    otherKind?: CaptureKind;

    /**
     * Whether the user is unmuting a device, as opposed to joining.
     */
    whenUnmuting: boolean;
}

const useStyles = makeStyles()(theme => {
    return {
        controls: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: theme.spacing(2),
            marginTop: theme.spacing(3)
        }
    };
});

/**
 * Returns the suffix of the translation keys for the given devices.
 *
 * @param {CaptureKind[]} kinds - The devices.
 * @returns {string}
 */
function getKeySuffix(kinds: CaptureKind[]) {
    if (kinds.length > 1) {
        return 'Both';
    }

    return kinds[0] === 'audio' ? 'Audio' : 'Video';
}

/**
 * Explains why the microphone or the camera is needed before the browser asks for access.
 *
 * @param {IProps} props - The component's props.
 * @returns {JSX.Element}
 */
const PermissionPromptDialog = ({ kinds, onDone, otherKind, whenUnmuting }: IProps) => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const done = useRef(false);
    const suffix = getKeySuffix(kinds);
    const [ useElement, setUseElement ] = useState(() =>
        Boolean(getCaptureElement(kinds) && (!otherKind || getCaptureElement([ ...kinds, otherKind ]))));

    const finish = useCallback((allowed: boolean) => {
        if (!done.current) {
            done.current = true;
            onDone(allowed);
        }
    }, [ onDone ]);

    // Closed without an answer, e.g. replaced by another dialog.
    useEffect(() => () => finish(false), []);

    const onAllow = useCallback(() => {
        finish(true);
        dispatch(hideDialog());
    }, [ finish ]);

    const onAllowBoth = useCallback(async () => {
        // A single prompt for both, the device that isn't being unmuted stays off.
        try {
            const tracks = await JitsiMeetJS.createLocalTracks({ devices: [ ...kinds, otherKind ] });

            tracks.forEach((track: any) => track.dispose());
        } catch {
            // The request for the unmuted device reports the failure.
        }
        onAllow();
    }, [ kinds, otherKind, onAllow ]);

    const onCancel = useCallback(() => finish(false), [ finish ]);
    const onElementUnsupported = useCallback(() => setUseElement(false), []);

    return (
        <Dialog
            back = {{
                hidden: !otherKind || useElement,
                onClick: onAllowBoth,
                translationKey: 'mediaPermissions.allowBoth'
            }}
            cancel = {{
                translationKey: whenUnmuting ? 'mediaPermissions.notNow' : `mediaPermissions.continueWithout${suffix}`
            }}
            disableAutoHideOnSubmit = { true }
            ok = {{
                hidden: useElement,
                translationKey: `mediaPermissions.allow${suffix}`
            }}
            onCancel = { onCancel }
            onSubmit = { onAllow }
            titleKey = { `mediaPermissions.promptTitle${suffix}` }>
            <div>{ t(`mediaPermissions.promptDescription${suffix}`) }</div>
            { useElement && (
                <div className = { classes.controls }>
                    <CaptureElement
                        kinds = { kinds }
                        onDone = { onAllow }
                        onUnsupported = { onElementUnsupported } />
                    { otherKind && (
                        <CaptureElement
                            kinds = { [ ...kinds, otherKind ] }
                            onDone = { onAllow }
                            onUnsupported = { onElementUnsupported } />
                    ) }
                </div>
            ) }
        </Dialog>
    );
};

export default PermissionPromptDialog;
