import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { getConferenceName } from '../../../base/conference/functions';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import Tooltip from '../../../base/tooltip/components/Tooltip';

interface IProps {

    /**
     * Whether or not the component is displayed in the toolbar.
     */
    inToolbar?: boolean;
}

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
        },
        inToolbar: {
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            padding: 0,
            backgroundColor: 'transparent',
            marginLeft: 0,
            height: 'auto',
            marginRight: theme.spacing(3)
        }
    };
});

/**
 * Label for the conference name.
 *
 * @returns {ReactElement}
 */
const SubjectText = ({ inToolbar }: IProps) => {
    const subject = useSelector(getConferenceName);
    const { classes, cx } = useStyles();

    return (
        <Tooltip
            content = { subject }
            position = 'bottom'>
            <div className = { cx(classes.container, inToolbar && classes.inToolbar) }>
                <div className = { cx('subject-text--content', classes.content) }>{subject}</div>
            </div>
        </Tooltip>
    );
};

export default SubjectText;
