const express = require('express')
const router = express.Router()
const sql_pool = require('./src/mysql')

router.post('/check_followed', (req, res) => {
    const id = req.session.sign
    const Follower = req.body.id //팔로우 하는 사람이 Follower로 들어감

    const sql_Followcheck = 'SELECT * FROM Follow WHERE Following = ? AND Follower = ?'
    sql_pool.query(sql_Followcheck, [Follower, id], (err_Followcheck, result_Followcheck) => {
        if (result_Followcheck.length > 0)
            res.send('followed')
        else
            res.send('unfollowed')
    })
})

router.post('/setFollow', (req, res) => {
    const id = req.session.sign
    const Follower = req.body.id

    const sql_Followcheck = 'SELECT * FROM Follow WHERE Following = ? AND Follower = ?'
    sql_pool.query(sql_Followcheck, [Follower, id], (err_Followcheck, result_Followcheck) => {
        let sql_follow
        let followed = result_Followcheck.length

        if (followed > 0)
            sql_follow = 'DELETE FROM Follow WHERE Following = ? AND Follower = ?'
        else
            sql_follow = 'INSERT INTO Follow (Following, Follower) VALUES(?,?)'

        sql_pool.query(sql_follow, [Follower, id], (err, result) => {
            if (err)
                console.log(err)
            else 
                res.send(!followed) 
        })
    })
})

router.post('/get_Following', (req, res) => {
    const id = req.body.id

    const sql_get = `SELECT user.* FROM Follow INNER JOIN user ON 
    user.id = Follow.Following WHERE Follower = ?`
    sql_pool.query(sql_get, [id], (err, rows, result)=> {
        if(err)
            console.log(err)
        else
            res.send(rows)
    })
})

router.post('/get_Follower', (req, res) => {
    const id = req.body.id

    const sql_get = `SELECT user.* FROM Follow INNER JOIN user ON 
    user.id = Follow.Follower WHERE Following = ?`
    sql_pool.query(sql_get, [id], (err, rows, result)=> {
        if(err)
            console.log(err)
        else
            res.send(rows)
    })
})

module.exports = router