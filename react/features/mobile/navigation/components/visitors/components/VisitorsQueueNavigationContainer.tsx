import { NavigationContainer, Theme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

import VisitorsQueue from '../../../../../visitors/components/native/VisitorsQueue';
import { screen } from '../../../routes';
import { navigationContainerTheme, visitorsScreenOptions } from '../../../screenOptions';

const VisitorsQueueStack = createStackNavigator();

/**
 * The visitors queue UI.
 *
 * @class
 */
export default function VisitorsQueueNavigationContainer() {
    return (
        <NavigationContainer
            independent = { true }
            theme = { navigationContainerTheme as Theme }>
            <VisitorsQueueStack.Navigator>
                <VisitorsQueueStack.Screen
                    component = { VisitorsQueue }
                    name = { screen.visitors.queue }
                    options = { visitorsScreenOptions } />
            </VisitorsQueueStack.Navigator>
        </NavigationContainer>
    );
}
