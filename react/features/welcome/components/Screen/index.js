import ScreenLayout from './Screens';
import { connect } from '../../../base/redux';

// eslint-disable-next-line react/no-multi-comp,new-cap
const WelcomePageScreen = ({ screenName }) => ScreenLayout({ screenName });

// eslint-disable-next-line require-jsdoc
function _mapStateToProps(state) {
    return {
        screenName: state['features/welcome'].currentScreen
    };
}

export default connect(_mapStateToProps)(WelcomePageScreen);
