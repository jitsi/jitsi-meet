/**
 * Define prejoinscreen elements.
*/
class PrejoinScreen {

    // Premeeting screen object.
    get PremeetingScreen() {
        return $('.premeeting-screen');
    };

    // Prejoin input object.
    get PrejoinInput() {
        return $('.prejoin-input-area input');
    }
}

module.exports = new PrejoinScreen();