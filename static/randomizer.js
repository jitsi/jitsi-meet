
(function (){
    //list of tips
    var items = [
        "You can pin participants by clicking on their thumbnails.",// jshint ignore:line
        "You can tell others you have something to say by using the \"Raise Hand\" feature",// jshint ignore:line
        "You can learn about key shortcuts by pressing Shift+?",// jshint ignore:line
        "You can learn more about the state of everyone's connection by hovering on the bars in their thumbnail",// jshint ignore:line
        "You can hide all thumbnails by using the button in the bottom right corner"// jshint ignore:line
    ];

    /**
     * Creates a new Randomiser.
     *
     * @class
     */
    function Randomizer(){
        this.items = items;
    }

    /**
     * Get a random integer between 0 and items length.
     *
     * @return {string} a random integer
     */
    Randomizer.prototype.getItem = function (){
        var l = this.items.length - 1;
        var n = Math.round(Math.random() * l);

        return this.items[n];
    };

    window.Randomizer = Randomizer;
})();

