export default {
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
    ES: "es",
    FR: "fr",
    HY: "hy",
    IT: "it",
    OC: "oc",
    PL: "pl",
    PTBR: "ptBR",
    RU: "ru",
    SK: "sk",
    SL: "sl",
    SV: "sv",
    TR: "tr"
};
