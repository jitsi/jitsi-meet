/**
 * Class representing Contact model
 * @class Contact
 */
export default class Contact {
    constructor(opts) {
        let {
            id,
            avatar,
            name,
            isLocal
        } = opts;

        this.id = id;
        this.avatar = avatar || '';
        this.name = name || '';
        this.isLocal = isLocal || false;
    }
}