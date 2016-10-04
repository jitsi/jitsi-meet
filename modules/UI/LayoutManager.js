const symbs = ['/', '*'];

/**
 * @class Dialog
 *
 */
export default class LayoutManager {

    constructor(routes) {
        this.routes = routes.rotes;
        this.handlers = routes.handlers;
    }

    //TODO: clear route method
    route (path) {
        let routes = this.routes;
        //special character
        if (symbs.indexOf(path) > -1) {
            return this.routeTo(routes[path]);
        } else {
            //first character - '/'
            let regStr = path.slice(1);
            for (let key in routes) {
                if( routes.hasOwnProperty(key) ) {
                    let regExp = new RegExp(key);

                    if (regExp.test(regStr)) {
                        return this.routeTo(routes[key]);
                    }
                }
            }
        }
    }

    routeTo (path) {
        return this.handlers[path]();
    }
}