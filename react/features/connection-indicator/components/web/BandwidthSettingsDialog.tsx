import React, { KeyboardEvent, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

// @ts-ignore
import { MIN_ASSUMED_BANDWIDTH_BPS } from '../../../../../modules/API/constants';
import { IReduxState } from '../../../app/types';
import { setAssumedBandwidthBps as saveAssumedBandwidthBps } from '../../../base/conference/actions';
import { IconInfoCircle } from '../../../base/icons/svg';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Dialog from '../../../base/ui/components/web/Dialog';
import Input from '../../../base/ui/components/web/Input';

const useStyles = makeStyles()(theme => {
    return {
        content: {
            color: theme.palette.text01
        },

        info: {
            background: theme.palette.ui01,
            ...withPixelLineHeight(theme.typography.labelRegular),
            color: theme.palette.text02,
            marginTop: theme.spacing(2)
        },

        possibleValues: {
            margin: 0,
            paddingLeft: theme.spacing(4)
        }
    };
});

/**
 * Bandwidth settings dialog component.
 *
 * @returns {ReactElement}
 */
const BandwidthSettingsDialog = () => {
    const { classes } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const [ showAssumedBandwidthInfo, setShowAssumedBandwidthInfo ] = useState(false);
    const currentAssumedBandwidthBps = useSelector(
        (state: IReduxState) => state['features/base/conference'].assumedBandwidthBps
    );
    const [ assumedBandwidthBps, setAssumedBandwidthBps ] = useState(
        currentAssumedBandwidthBps === MIN_ASSUMED_BANDWIDTH_BPS
        || currentAssumedBandwidthBps === undefined
            ? ''
            : currentAssumedBandwidthBps
    );

    /**
     * Changes the assumed bandwidth bps.
     *
     * @param {string} value - The key event to handle.
     *
     * @returns {void}
     */
    const onAssumedBandwidthBpsChange = useCallback((value: string) => {
        setAssumedBandwidthBps(value);
    }, [ setAssumedBandwidthBps ]);

    /**
     * Persists the assumed bandwidth bps.
     *
     * @param {string} value - The key event to handle.
     *
     * @returns {void}
     */
    const onAssumedBandwidthBpsSave = useCallback(() => {
        if (assumedBandwidthBps !== currentAssumedBandwidthBps) {
            dispatch(saveAssumedBandwidthBps(Number(
                assumedBandwidthBps === '' ? MIN_ASSUMED_BANDWIDTH_BPS : assumedBandwidthBps
            )));
        }
    }, [ assumedBandwidthBps, currentAssumedBandwidthBps, dispatch, saveAssumedBandwidthBps ]);

    /**
     * Validates the assumed bandwidth bps.
     *
     * @param {KeyboardEvent<any>} e - The key event to handle.
     *
     * @returns {void}
     */
    const onAssumedBandwidthBpsKeyPress = useCallback((e: KeyboardEvent<any>) => {
        const isValid = (e.charCode !== 8 && e.charCode === 0) || (e.charCode >= 48 && e.charCode <= 57);

        if (!isValid) {
            e.preventDefault();
        }
    }, []);

    /**
     * Callback invoked to hide or show the possible values
     * of the assumed bandwidth setting.
     *
     * @returns {void}
     */
    const toggleInfoPanel = useCallback(() => {
        setShowAssumedBandwidthInfo(!showAssumedBandwidthInfo);
    }, [ setShowAssumedBandwidthInfo, showAssumedBandwidthInfo ]);

    return (
        <Dialog
            onSubmit = { onAssumedBandwidthBpsSave }
            titleKey = 'bandwidthSettings.title'>
            <div className = { classes.content }>
                <Input
                    bottomLabel = { t('bandwidthSettings.assumedBandwidthBpsWarning') }
                    icon = { IconInfoCircle }
                    iconClick = { toggleInfoPanel }
                    id = 'setAssumedBandwidthBps'
                    label = { t('bandwidthSettings.setAssumedBandwidthBps') }
                    minValue = { 0 }
                    name = 'assumedBandwidthBps'
                    onChange = { onAssumedBandwidthBpsChange }
                    onKeyPress = { onAssumedBandwidthBpsKeyPress }
                    placeholder = { t('bandwidthSettings.assumedBandwidthBps') }
                    type = 'number'
                    value = { assumedBandwidthBps } />
                {showAssumedBandwidthInfo && (
                    <div className = { classes.info }>
                        <span>{t('bandwidthSettings.possibleValues')}:</span>
                        <ul className = { classes.possibleValues }>
                            <li>
                                <b>{t('bandwidthSettings.leaveEmpty')}</b> {t('bandwidthSettings.leaveEmptyEffect')}
                            </li>
                            <li><b>0</b> {t('bandwidthSettings.zeroEffect')}</li>
                            <li>
                                <b>{t('bandwidthSettings.customValue')}</b> {t('bandwidthSettings.customValueEffect')}
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default BandwidthSettingsDialog;
