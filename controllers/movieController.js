const { db } = require("../config");
const { promisify } = require('util');
const dba = promisify(db.query).bind(db);

module.exports = {
    GetAllMovie: async (req, res) => {
        let sql = `select m.name, m.release_date, m.release_month, m.release_year, m.duration_min, m.genre, m.description, ms.status, l.location, st.time  
        from movies m 
        join movie_status ms on m.status = ms.id
        join schedules sc on m.id = sc.movie_id
        join locations l on sc.location_id = l.id
        join show_times st on sc.time_id = st.id ;`
        db.query(sql, (error, result) => {
            if (error) return res.status(500).send(error);
            return res.status(200).send(result);
        });
    },
    GetMovieByQuery: async (req, res) => {
        const { status, location, time } = req.query
        let sql = `select m.name, m.release_date, m.release_month, m.release_year, m.duration_min, m.genre, m.description, ms.status, l.location, st.time  
        from movies m 
        join movie_status ms on m.status = ms.id
        join schedules sc on m.id = sc.movie_id
        join locations l on sc.location_id = l.id
        join show_times st on sc.time_id = st.id
        where NOT m.id = 0 `
        if (status) {
            sql += `and ms.status = ${db.escape(status)} `
        }
        if (location) {
            sql += `and l.location = ${db.escape(location)} `
        }
        if (time) {
            sql += `and st.time = ${db.escape(time)}`
        }
        db.query(sql, (error, result) => {
            if (error) {
                console.error(error)
                return res.status(500).send({ message: "server error" })
            }
            return res.status(200).send(result)
        })
    },
    PostFilm: async (req, res) => {
        try {
            const { name, genre, release_date, release_month, release_year, duration_min, description, token } = req.body
            const { uid } = req.user
            if (!name || !genre || !release_date || !release_month || !release_year || !duration_min || !description || !token) {
                throw { message: "input tidak boleh kosong / typo" }
            }
            if (token === req.body.token) {
                db.query(`select * from users where uid = ?`, [uid], (error, result) => {
                    if (error) return res.status(400).send({ message: "bad request" })
                    // console.log(result)
                    if (result[0].role === 1) {
                        let dataAdd = {
                            name: name,
                            genre: genre,
                            release_date: release_date,
                            release_month: release_month,
                            release_year: release_year,
                            duration_min: duration_min,
                            description: description,
                        }
                        db.query(`insert into movies set ?`, [dataAdd], (error) => {
                            if (error) throw { message: "salah query" }
                            db.query(`select id, name, genre, release_date, release_month, release_year, duration_min, description from movies where name = ?`, [name], (error, result2) => {
                                if (error) {
                                    return res.status(400).send(error)
                                }
                                return res.status(200).send(result2)
                            })
                        })
                    } else {
                        return res.status(400).send({ message: "role harus admin" })
                    }
                })
            } else {
                return res.status(401).send({ message: "access denied" })
            }
        } catch (error) {
            console.error(error)
            return res.status(500).send({ error: true, message: error.message })
        }
    },
    ChangeStatusFilm: async (req, res) => {
        try {
            const { id } = req.params;
            const { status, token } = req.body
            const { role } = req.user
            if (!status || !token) {
                return res.status(400).send({ message: "bad request" })
            }
            if (token === req.body.token) {
                if (role === 1) {
                    let dataUpdate = {
                        status: status,
                    };
                    let sql = `UPDATE movies SET status = ${status} WHERE id=${parseInt(id)}`
                    await dba(sql, [dataUpdate, id])
                    return res.status(200).send({ id: id, message: "status has been changed" })
                } else {
                    return res.status(400).send({ message: "role harus admin" })
                }
            } else {
                return res.status(401).send({ message: "access denied" })
            }
        } catch (error) {
            // console.error(error)
            res.status(500).send({ message: "server error" })
        }
    },
    AddSchedule: async (req, res) => {
        try {
            const { id } = req.params.id
            const { location_id, time_id, token } = req.body
            const { role } = req.user
            if (!location_id || !time_id || !token) {
                return res.status(400).send({ message: "input can't be empty" })
            }
            if (token === req.token) {
                if (role === 1) {
                    let dataToSend = {
                        movie_id: id,
                        location_id: location_id,
                        time_id: time_id
                    }
                    db.query(`INSERT INTO schedules (movie_id,location_id,time_id) VALUES (${id},${location_id},${time_id})`, dataToSend, (error) => {
                        if (error) throw { message: "query tipo" }
                        res.status(201).send({ id: id, message: "schedule has been added" })
                    })
                } else {
                    throw { message: "role harus admin" }
                }
            } else {
                return res.status(401).send({ message: "access denied" })
            }

        } catch (error) {
            console.error(error)
            return res.status(500).send(error)
        }
    },
};