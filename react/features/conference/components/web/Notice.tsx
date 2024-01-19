import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';

const useStyles = makeStyles()(theme => {
    return {
        notice: {
            position: 'absolute',
            left: '50%',
            zIndex: 3,
            marginTop: theme.spacing(2),
            transform: 'translateX(-50%)'
        },

        message: {
            backgroundColor: theme.palette.uiBackground,
            color: theme.palette.text01,
            padding: '3px',
            borderRadius: '5px'
        }
    };
});

const Notice = () => {
    const message = useSelector((state: IReduxState) => state['features/base/config'].noticeMessage);
    const { classes } = useStyles();

    if (!message) {
        return null;
    }

    return (
        <div className = { classes.notice }>
            <span className = { classes.message } >
                {message}
            </span>
        </div>
    );
};

export default Notice;
