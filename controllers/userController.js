const { db } = require('../config');
const util = require('util');
const { createAccessToken } = require("../helpers/createToken");
const { promisify } = require('util')
const dba = promisify(db.query).bind(db)
const query = util.promisify(db.query).bind(db)

module.exports = {
    Register: async (req, res) => {
        try {
            const { email, username, password } = req.body;
            let numbers = /[0-9]/g;
            let capital = /[a-z]/g;
            let special = /[.*+!?^${}()|[\]\\]/g;
            let at = /[@]/g;
            if (!email || !username || !password)
                throw { message: "input harus diisi semua" };
            if (username.length < 6) throw { message: "username minimal 6 huruf" };
            if (password.length < 6)
                throw { message: "password harus lebih dari 6 karakter" };
            if (!email.match(at))
                throw { message: "pastikan input email dalam bentuk email" };
            if (!password.match(capital)) throw { message: "harus kombinasi huruf" };
            if (!password.match(numbers)) throw { message: "harus mengandung angka" };
            if (!password.match(special))
                throw { message: "harus mengandung spesial karakter" };
            let sql = `select * from users where username = ?`;
            const user = await dba(sql, [username, email]);
            if (user.length) {
                return res.status(500).send({ message: "username sudah terpakai" });
            }
            sql = `insert users set ?`;
            const data = {
                uid: Date.now(),
                username: username,
                password: password,
                email: email,
            };
            await dba(sql, [data]);
            sql = `select id,uid,username,email from users where uid = ?`;
            const iduser = data.uid;
            const datauser = await dba(sql, [iduser]);
            let dataToken = {
                uid: datauser[0].uid,
                role: datauser[0].role,
            };
            const tokenAccess = createAccessToken(dataToken);
            res.set("x-token-access", tokenAccess);
            res.status(200).send({ ...datauser[0], token: tokenAccess });
        } catch (error) {
            return res.status(500).json({
                error: true,
                message: error.message,
            });
        }
    },
    Login: async (req, res) => {
        try {
            const { user, password } = req.body;
            if (!user || !password) throw { message: "password atau username salah" };
            let sql = `select id,uid,username,email,password,role,status from users where (username = ? or email = ?) and password = ?`;
            const datauser = await dba(sql, [user, user, password]);
            if (datauser.length == 0) throw { message: "user tidak terdaftar" };
            if (datauser[0].status !== 1)
                return res
                    .status(500)
                    .send({ message: "user sudah dihapus atau sedang deactive" });
            if (datauser[0].password !== password)
                return res.status(500).send({ message: "password salah" });
            if (datauser.length) {
                const datatoken = {
                    uid: datauser[0].uid,
                    role: datauser[0].role,
                };
                const token = createAccessToken(datatoken);
                sql = `select id,uid,username,email,role,status from users where username = ?`;
                const datasend = await dba(sql, [user]);
                res.set("x-token-access", token);
                return res.status(200).send({ ...datasend[0], token: token });
            }
        } catch (error) {
            return res.status(500).json({
                error: true,
                message: error.message,
            });
        }
    },
    ActivateAccount: async (req, res) => {
        try {
            const { uid } = req.user;
            const response = await dba(`SELECT * FROM users WHERE uid = '${uid}'`);
            const userId = response[0].uid;
            const status = response[0].status;
            if (status === 2) {
                await dba(`UPDATE users SET status =1 WHERE uid='${userId}'`);
                return res.send({
                    uid,
                    status: "active",
                });
            } else if (status === 3) {
                return res.send({
                    message: "Your account status is closed",
                    status: "Closed",
                });
            }
        } catch (err) {
            console.log(err);
            res.send(err.message);
        }
    },
    DeactiveAccount: async (req, res, next) => {
        try {
            const { uid } = req.user;
            const response = await query(`SELECT * FROM users WHERE uid = '${uid}'`);
            const userId = response[0].uid;
            const status = response[0].status;
            if (status === 3) {
                return res.send({
                    message: "Your account status is closed",
                    status: "closed",
                });
            } else {
                await query(`UPDATE users SET status =2 WHERE uid='${userId}'`);
                return res.send({
                    uid,
                    status: "deactive",
                });
            }
        } catch (err) {
            console.log(err);
            res.send(err.message);
        }
    },
    CloseAccount: async (req, res, next) => {
        try {
            let sql = `select * from users where id = ? `;
            let datauser = await dba(sql, req.user.id);
            if (datauser[0].status === 3) {
                return res.status(500).send({
                    message:
                        "Akun sudah ditutup",
                });
            } else {
                sql = `update users set ? where id = ?`;
                datauser = await dba(sql, [{ status: 3 }, req.user.id]);

                sql = `select uid from users where id = ?`;
                datauser = await dba(sql, req.user.id);
                return res.status(200).send({ ...datauser[0], status: "closed" });
            }
        } catch (error) {
            next(error);
        }
    },
}