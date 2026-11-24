import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { createPreCallTestHelpEvent } from '../../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../../analytics/functions';
import { IReduxState } from '../../../../app/types';
import Icon from '../../../icons/components/Icon';
import { IconWarningCircle } from '../../../icons/svg';
import { runPreCallTest } from '../../actions.web';
import { getPreCallTestHelpUrl, getPreCallTestProblem } from '../../functions';
import { PreCallTestStatus } from '../../types';

const useStyles = makeStyles()(theme => {
    return {
        actions: {
            columnGap: theme.spacing(3),
            display: 'flex',
            flexWrap: 'wrap',
            rowGap: theme.spacing(1)
        },
        connectionStatus: {
            ...theme.typography.bodyShortRegular,
            alignItems: 'flex-start',
            backgroundColor: theme.palette.prejoinDeviceStatusWarning,
            borderRadius: '6px',
            color: theme.palette.prejoinDeviceStatusText,
            display: 'flex',
            gap: theme.spacing(3),
            marginTop: theme.spacing(2),
            padding: '12px 16px',
            textAlign: 'left',

            '& svg': {
                flexShrink: 0
            }
        },
        link: {
            ...theme.typography.bodyShortBold,
            background: 'none',
            border: 0,
            color: 'inherit',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',

            '&:disabled': {
                cursor: 'default',
                opacity: 0.6
            }
        },
        text: {
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(1)
        },
        title: {
            ...theme.typography.bodyShortBold
        }
    };
});

/**
 * Checks the connection to the TURN servers when shown, and warns when the network blocks calls or their faster
 * transport. Shows nothing otherwise.
 *
 * @returns {ReactElement | null}
 */
const ConnectionStatus = () => {
    const { classes, theme } = useStyles();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const problem = useSelector(getPreCallTestProblem);
    const helpUrl = useSelector(getPreCallTestHelpUrl);
    const checking = useSelector((state: IReduxState) =>
        state['features/base/premeeting'].preCallTestState.status === PreCallTestStatus.RUNNING);

    useEffect(() => {
        dispatch(runPreCallTest());
    }, []);

    const checkAgain = useCallback(() => dispatch(runPreCallTest()), []);
    const onHelpClick = useCallback(() => sendAnalytics(createPreCallTestHelpEvent(problem ?? '')), [ problem ]);

    if (!problem) {
        return null;
    }

    return (
        <div
            className = { classes.connectionStatus }
            role = 'alert'>
            <Icon
                color = { theme.palette.prejoinDeviceStatusText }
                size = { 20 }
                src = { IconWarningCircle } />
            <div className = { classes.text }>
                <span className = { classes.title }>{ t(`prejoin.connection.${problem}.title`) }</span>
                <span>{ t(`prejoin.connection.${problem}.description`) }</span>
                <div className = { classes.actions }>
                    <button
                        className = { classes.link }
                        disabled = { checking }
                        onClick = { checkAgain }
                        type = 'button'>
                        { t(checking ? 'prejoin.connection.checking' : 'prejoin.connection.checkAgain') }
                    </button>
                    { helpUrl && (
                        <a
                            className = { classes.link }
                            href = { helpUrl }
                            onClick = { onHelpClick }
                            rel = 'noopener noreferrer'
                            target = '_blank'>
                            { t('prejoin.connection.helpLink') }
                        </a>
                    ) }
                </div>
            </div>
        </div>
    );
};

export default ConnectionStatus;
