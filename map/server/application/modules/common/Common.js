const crypto = require('crypto');

class Common {

    md5(text) {
        return crypto.createHash('md5').update(text).digest('hex');
    }

    guid() {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
            (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
        );
    }
}

module.exports = Common;