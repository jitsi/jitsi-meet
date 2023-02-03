import clsx from 'clsx';
import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { getConferenceName } from '../../../base/conference/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { Tooltip } from '../../../base/tooltip';

const useStyles = makeStyles()(theme => {
    return {
        container: {
            ...withPixelLineHeight(theme.typography.bodyLongRegular),
            color: theme.palette.text01,
            padding: '2px 16px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            maxWidth: '324px',
            boxSizing: 'border-box',
            height: '28px',
            borderRadius: `${theme.shape.borderRadius}px 0 0 ${theme.shape.borderRadius}px`,
            marginLeft: '2px',

            '@media (max-width: 300px)': {
                display: 'none'
            }
        },
        content: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        }
    };
});

/**
 * Label for the conference name.
 *
 * @returns {ReactElement}
 */
const SubjectText = () => {
    const subject = useSelector(getConferenceName);
    const { classes } = useStyles();

    return (
        <div className = { classes.container }>
            <Tooltip
                content = { subject }
                position = 'bottom'>
                <div className = { clsx('subject-text--content', classes.content) }>{subject}</div>
            </Tooltip>
        </div>
    );
};

export default SubjectText;
