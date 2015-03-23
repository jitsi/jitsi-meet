module.exports = {
    getLanguages : function () {
        var languages = [];
        for(var lang in this)
        {
            if(typeof this[lang] === "string")
                languages.push(this[lang]);
        }
        return languages;
    },
    EN: "en",
    IT: "it",
    BG: "bg",
    DE: "de",
    TR: "tr"
}
