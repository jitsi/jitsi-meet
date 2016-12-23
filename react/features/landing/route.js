import { RouteRegistry } from '../base/navigator';
import { Landing } from './components';

RouteRegistry.register({
    component: Landing,
    path: '/mobile-app',
    onEnter: store => () => {
        const state = store.getState();
        const { landingIsShown } = state;

        if (landingIsShown) {
            return;
        }
    }
});
