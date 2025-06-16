import React from 'react';

import { createRecentClickedEvent, createRecentSelectedEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { appNavigate } from '../../app/actions';
import { IStore } from '../../app/types';
import AbstractPage from '../../base/react/components/AbstractPage';
import { Container, Text } from '../../base/react/components/index';

import styles from './styles';

/**
 * The type of the React {@code Component} props of {@link AbstractRecentList}.
 */
interface IProps {

    /**
     * The redux store's {@code dispatch} function.
     */
    dispatch: IStore['dispatch'];

    /**
     * The translate function.
     */
    t: Function;
}

/**
 * An abstract component for the recent list.
 *
 */
export default class AbstractRecentList<P extends IProps> extends AbstractPage<P> {
    /**
     * Initializes a new {@code RecentList} instance.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        this._onPress = this._onPress.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        sendAnalytics(createRecentSelectedEvent());
    }

    /**
     * Returns a list empty component if a custom one has to be rendered instead
     * of the default one in the {@link NavigateSectionList}.
     *
     * @private
     * @returns {React$Component}
     */
    _getRenderListEmptyComponent() {
        const { t } = this.props;
        const descriptionId = 'meetings-list-empty-description';

        return (
            <Container
                aria-describedby = { descriptionId }
                aria-label = { t('welcomepage.recentList') }
                className = 'meetings-list-empty'
                role = 'region'
                style = { styles.emptyListContainer as any }>
                <Text // @ts-ignore
                    className = 'description'
                    id = { descriptionId }
                    style = { styles.emptyListText as any }>
                    { t('welcomepage.recentListEmpty') }
                </Text>
            </Container>
        );
    }

    /**
     * Handles the list's navigate action.
     *
     * @private
     * @param {string} url - The url string to navigate to.
     * @returns {void}
     */
    _onPress(url: string) {
        const { dispatch } = this.props;

        sendAnalytics(createRecentClickedEvent('meeting.tile'));

        dispatch(appNavigate(url));
    }
}
