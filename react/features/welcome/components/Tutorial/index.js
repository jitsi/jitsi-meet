import TutorialLayout from './Steps';
import { connect } from '../../../base/redux';

// eslint-disable-next-line react/no-multi-comp,new-cap
const Tutorial = ({ screenName }) => TutorialLayout({ screenName });

// eslint-disable-next-line require-jsdoc
function _mapStateToProps(state) {
    return {
        screenName: state['features/welcome'].currentScreen
    };
}

export default connect(_mapStateToProps)(Tutorial);
