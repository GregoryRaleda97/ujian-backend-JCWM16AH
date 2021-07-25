const jwt = require("jsonwebtoken");

require('dotenv').config();

module.exports.verifyTokenAccess = (req, res, next) => {
    // console.log("token", req.token);
    const token = req.body.token;
    // const key = process.env.TOKEN_1;
    if (!token) return res.status(406).send({ error: true, detail: 'Error Token', message: 'Token Not Found' })

    jwt.verify(token, process.env.JWT_SECRETKEY, (err, dataToken) => {
        try {
            if (err) throw err
            req.dataToken = dataToken
            next()
        } catch (error) {
            res.status(500).send({
                error: true,
                detail: 'Error Server',
                message: error.message
            })
        }
    });
};
