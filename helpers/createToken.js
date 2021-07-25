const jwt = require('jsonwebtoken');

module.exports = {
    createAccessToken: (payload) => {
        return jwt.sign(payload, "backend$");
    },
}