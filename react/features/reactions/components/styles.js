import { createStyleSheet } from '../../base/styles';

import { merge, tada, flip } from 'react-animations';

const tadaFlip = merge(tada, flip);

export default createStyleSheet({
    bounce: {
        animationName: tadaFlip,
        animationDuration: '10s'
    }
});
