import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { createE2EEEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState, IStore } from '../../app/types';
import Switch from '../../base/ui/components/web/Switch';
import { toggleE2EE } from '../actions';
import { MAX_MODE } from '../constants';
import { doesEveryoneSupportE2EE } from '../functions';

interface IProps {

    /**
     * The resource for the description, computed based on the maxMode and whether the switch is toggled or not.
     */
    _descriptionResource?: string;

    /**
     * Custom e2ee labels.
     */
    _e2eeLabels: any;

    /**
     * Whether the switch is currently enabled or not.
     */
    _enabled: boolean;

    /**
     * Indicates whether all participants in the conference currently support E2EE.
     */
    _everyoneSupportE2EE: boolean;

    /**
     * Whether E2EE is currently enabled or not.
     */
    _toggled: boolean;

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: IStore['dispatch'];
}

const useStyles = makeStyles()(() => {
    return {
        e2eeSection: {
            display: 'flex',
            flexDirection: 'column'
        },

        description: {
            fontSize: '13px',
            margin: '15px 0'
        },

        controlRow: {
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '15px',

            '& label': {
                fontSize: '14px',
                fontWeight: 'bold'
            }
        }
    };
});

/**
 * Implements a React {@code Component} for displaying a security dialog section with a field
 * for setting the E2EE key.
 *
 * @param {IProps} props - Component's props.
 * @returns  {JSX}
 */
const E2EESection = ({
    _descriptionResource,
    _enabled,
    _e2eeLabels,
    _everyoneSupportE2EE,
    _toggled,
    dispatch
}: IProps) => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const [ toggled, setToggled ] = useState(_toggled ?? false);

    useEffect(() => {
        setToggled(_toggled);
    }, [ _toggled ]);

    /**
     * Callback to be invoked when the user toggles E2EE on or off.
     *
     * @private
     * @returns {void}
     */
    const _onToggle = useCallback(() => {
        const newValue = !toggled;

        setToggled(newValue);

        sendAnalytics(createE2EEEvent(`enabled.${String(newValue)}`));
        dispatch(toggleE2EE(newValue));
    }, [ toggled ]);

    const description = _e2eeLabels?.description || t(_descriptionResource ?? '');
    const label = _e2eeLabels?.label || t('dialog.e2eeLabel');
    const warning = _e2eeLabels?.warning || t('dialog.e2eeWarning');

    return (
        <div
            className = { classes.e2eeSection }
            id = 'e2ee-section'>
            <p
                aria-live = 'polite'
                className = { classes.description }
                id = 'e2ee-section-description'>
                {description}
                {!_everyoneSupportE2EE && <br />}
                {!_everyoneSupportE2EE && warning}
            </p>
            <div className = { classes.controlRow }>
                <label htmlFor = 'e2ee-section-switch'>
                    {label}
                </label>
                <Switch
                    checked = { toggled }
                    disabled = { !_enabled }
                    id = 'e2ee-section-switch'
                    onChange = { _onToggle } />
            </div>
        </div>
    );
};

/**
 * Maps (parts of) the Redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState) {
    const { enabled: e2eeEnabled, maxMode } = state['features/e2ee'];
    const { e2ee = {} } = state['features/base/config'];

    let descriptionResource: string | undefined = '';

    if (e2ee.labels) {
        // When e2eeLabels are present, the description resource is ignored.
        descriptionResource = undefined;
    } else if (maxMode === MAX_MODE.THRESHOLD_EXCEEDED) {
        descriptionResource = 'dialog.e2eeDisabledDueToMaxModeDescription';
    } else if (maxMode === MAX_MODE.ENABLED) {
        descriptionResource = e2eeEnabled
            ? 'dialog.e2eeWillDisableDueToMaxModeDescription' : 'dialog.e2eeDisabledDueToMaxModeDescription';
    } else {
        descriptionResource = 'dialog.e2eeDescription';
    }

    return {
        _descriptionResource: descriptionResource,
        _e2eeLabels: e2ee.labels,
        _enabled: maxMode === MAX_MODE.DISABLED || e2eeEnabled,
        _toggled: e2eeEnabled,
        _everyoneSupportE2EE: Boolean(doesEveryoneSupportE2EE(state))
    };
}

export default connect(mapStateToProps)(E2EESection);
