import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../../app/types';
import { withPixelLineHeight } from '../../../styles/functions.web';
import Checkbox from '../../../ui/components/web/Checkbox';
import getUnsafeRoomText from '../../../util/getUnsafeRoomText.web';
import { setUnsafeRoomConsent } from '../../actions.web';

const useStyles = makeStyles()(theme => {
    return {
        warning: {
            backgroundColor: theme.palette.warning01,
            color: theme.palette.text04,
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            padding: theme.spacing(3),
            borderRadius: theme.shape.borderRadius,
            marginBottom: theme.spacing(3)
        },
        consent: {
            padding: `0 ${theme.spacing(3)}`,
            '@media (max-width: 720px)': {
                marginBottom: theme.spacing(3)
            }
        }
    };
});

const UnsafeRoomWarning = () => {
    const { t } = useTranslation();
    const { classes } = useStyles();
    const dispatch = useDispatch();
    const { unsafeRoomConsent } = useSelector((state: IReduxState) => state['features/base/premeeting']);
    const toggleConsent = useCallback(
        () => dispatch(setUnsafeRoomConsent(!unsafeRoomConsent))
        , [ unsafeRoomConsent, dispatch ]);

    return (
        <>
            <div className = { classes.warning }>
                {getUnsafeRoomText(t, 'prejoin')}
            </div>
            <Checkbox
                checked = { unsafeRoomConsent }
                className = { classes.consent }
                label = { t('prejoin.unsafeRoomConsent') }
                onChange = { toggleConsent } />
        </>
    );
};

export default UnsafeRoomWarning;
