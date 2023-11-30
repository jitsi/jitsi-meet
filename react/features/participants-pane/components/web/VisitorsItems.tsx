import React from 'react';
import { makeStyles } from 'tss-react/mui';

import { IPromotionRequest } from '../../../visitors/types';

import { VisitorsItem } from './VisitorsItem';

interface IProps {

    /**
     * List with the visitors requesting promotion.
     */
    requests: IPromotionRequest[];
}

const useStyles = makeStyles()(theme => {
    return {
        container: {
            margin: `${theme.spacing(3)} 0`
        }
    };
});

/**
 * Component used to display a list of visitors requesting promotion.
 *
 * @param {Object} props - The props of the component.
 * @returns {ReactNode}
 */
function VisitorItems({ requests }: IProps) {
    const { classes } = useStyles();

    return (
        <div
            className = { classes.container }
            id = 'visitor-list'>
            {requests.map(r => (
                <VisitorsItem
                    key = { r.from }
                    request = { r } />)
            )}
        </div>
    );
}

// Memoize the component in order to avoid rerender on drawer open/close.
export default React.memo<IProps>(VisitorItems);
