import React from 'react';
import { makeStyles } from 'tss-react/mui';

import Button from '../../../base/ui/components/web/Button';
import Spinner from '../../../base/ui/components/web/Spinner';
import { BUTTON_TYPES } from '../../../base/ui/constants.web';

interface IProps {

    /**
     * Translation key for the action button.
     */
    actionLabelKey: string;

    /**
     * Button type for the action button.
     */
    actionType?: BUTTON_TYPES;

    /**
     * Whether the action button should be disabled.
     */
    disabled?: boolean;

    /**
     * The icon component to display.
     */
    icon: React.ComponentType;

    /**
     * Whether this item's action is in progress.
     */
    isLoading?: boolean;

    /**
     * Secondary text (type label, company, stage, etc.).
     */
    metadata?: string;

    /**
     * The primary display name.
     */
    name: string;

    /**
     * Click handler for the action button.
     */
    onAction: () => void;
}

const useStyles = makeStyles()(theme => {
    return {
        item: {
            display: 'flex',
            alignItems: 'center',
            padding: '10px 12px',
            backgroundColor: theme.palette.ui03,
            borderRadius: theme.shape.borderRadius,
            marginBottom: '6px',

            '&:last-child': {
                marginBottom: 0
            }
        },
        iconContainer: {
            width: '24px',
            height: '24px',
            marginRight: '12px',
            flexShrink: 0,

            '& svg': {
                width: '24px',
                height: '24px',
                borderRadius: theme.shape.borderRadius
            }
        },
        itemInfo: {
            flex: 1,
            minWidth: 0
        },
        itemName: {
            fontSize: '0.875rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
        },
        itemMeta: {
            fontSize: '0.75rem',
            color: theme.palette.text03,
            marginTop: '2px'
        },
        buttonContainer: {
            marginLeft: '12px',
            flexShrink: 0
        },
        spinnerContainer: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '70px'
        }
    };
});

/**
 * Reusable list item component for Salesforce records with an action button.
 *
 * @param {IProps} props - Component props.
 * @returns {React.ReactElement}
 */
export const RecordListItem = ({
    actionLabelKey,
    actionType = BUTTON_TYPES.PRIMARY,
    disabled = false,
    icon: Icon,
    isLoading = false,
    metadata,
    name,
    onAction
}: IProps) => {
    const { classes } = useStyles();

    return (
        <div className = { classes.item }>
            <div className = { classes.iconContainer }>
                <Icon />
            </div>
            <div className = { classes.itemInfo }>
                <div className = { classes.itemName }>{name}</div>
                {metadata && <div className = { classes.itemMeta }>{metadata}</div>}
            </div>
            <div className = { classes.buttonContainer }>
                {isLoading ? (
                    <div className = { classes.spinnerContainer }>
                        <Spinner size = 'small' />
                    </div>
                ) : (
                    <Button
                        disabled = { disabled }
                        labelKey = { actionLabelKey }
                        onClick = { onAction }
                        size = 'small'
                        type = { actionType } />
                )}
            </div>
        </div>
    );
};

export default RecordListItem;
