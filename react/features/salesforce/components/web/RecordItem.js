// @flow
import { makeStyles } from '@material-ui/core';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { RECORD_TYPE } from '../../constants';

/**
 * The type of the React {@code Component} props of {@link RecordItem}.
 */
type Props = {

    /**
     * The id of the record.
     */
    id: String,

    /**
     * The name of the record.
     */
    name: String,

    /**
     * The type of the record.
     */
    type: String,

    /**
     * The handler for the click event.
     */
    onClick: Function
}

const useStyles = makeStyles(theme => {
    return {
        recordItem: {
            display: 'flex',
            alignItems: 'center'
        },
        recordTypeIcon: {
            borderRadius: theme.shape.borderRadius,
            height: '40px',
            marginRight: '16px',
            width: '40px'
        },
        recordDetails: {
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'space-around',
            overflow: 'hidden',
            padding: '12px 0',
            textOverflow: 'ellipsis'
        },
        recordName: {
            fontSize: '15px',
            fontWeight: 400,
            lineHeight: '20px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        },
        recordType: {
            fontSize: '13px',
            fontWeight: 400,
            lineHeight: '18px'
        }
    };
});

/**
 * Component to render Record data.
 *
 * @param {Props} props - The props of the component.
 * @returns {React$Element<any>}
 */
export const RecordItem = ({
    id,
    name,
    /* eslint-disable-next-line no-empty-function */
    onClick = () => {},
    type
}: Props) => {
    const { t } = useTranslation();
    const classes = useStyles();
    const Icon = RECORD_TYPE[type].icon;

    return (
        <li
            className = { classes.recordItem }
            key = { `record-${id}` }
            onClick = { onClick }
            title = { name }>
            <div className = { classes.recordTypeIcon }>{Icon && <Icon />}</div>
            <div className = { classes.recordDetails }>
                <div
                    className = { classes.recordName }
                    key = { name }>
                    {name}
                </div>
                <div
                    className = { classes.recordType }
                    key = { type }>
                    {t(RECORD_TYPE[type].label)}
                </div>
            </div>
        </li>
    );
};
