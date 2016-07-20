module.exports = {
    getLanguages : function () {
        var languages = [];
        for (var lang in this)
        {
            if (typeof this[lang] === "string")
                languages.push(this[lang]);
        }
        return languages;
    },
    EN: "en",
    BG: "bg",
    DE: "de",
    TR: "tr",
    FR: "fr",
    ES: "es",
    IT: "it",
    PTBR: "ptBR",
    SK: "sk",
    SL: "sl",
    SV: "sv"
};
