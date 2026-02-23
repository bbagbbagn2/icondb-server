const express = require('express')
const router = express.Router()
const sql_pool = require('./src/mysql')

router.post('/check_liked', (req, res) => {
    const content_id = req.body.content_id
    const id = req.session.sign

    const sql_likecheck = 'SELECT * FROM likefunction WHERE id = ? AND content_idx = ?'
    sql_pool.query(sql_likecheck, [id, content_id], (err_likecheck, result_likecheck) => {
        if (result_likecheck.length > 0)
            res.send('liked')
        else
            res.send('unliked')
    })
})

router.post('/setLike', (req, res) => {
    const content_id = req.body.content_id
    const id = req.session.sign

    const sql_likecheck = 'SELECT * FROM likefunction WHERE id = ? AND content_idx = ?'
    sql_pool.query(sql_likecheck, [id, content_id], (err_likecheck, result_likecheck) => {
        let sql_liketableupdate
        let sql_likeupdate = `UPDATE content SET content.like = content.like-1 WHERE content_id = ?`
        let like = result_likecheck.length > 0

        if (like) {
            sql_likeupdate = `UPDATE content SET content.like = content.like-1 WHERE content_id = ?`
            sql_liketableupdate = 'DELETE FROM likefunction WHERE id = ? AND content_idx = ?'
        }
        else {
            sql_likeupdate = `UPDATE content SET content.like = content.like+1 WHERE content_id = ?`
            sql_liketableupdate = 'INSERT INTO likefunction(id, content_idx) VALUES (?,?)'
        }

        sql_pool.query(sql_likeupdate, [content_id], (err_likeupdate, result_likeupdate) => {
            if (err_likeupdate)
                console.log(err_likeupdate)
            else {
                sql_pool.query(sql_liketableupdate, [id, content_id], (err_liketableupdate, result_liketableupdate) => {
                    if (err_liketableupdate)
                        console.log(err_liketableupdate)
                    else
                        res.send(!like)
                })
            }
        })
    })
})

router.post('/get_userlike', (req, res) => {
    const id = req.body.id
    const sql_getlike = `SELECT content.* FROM likefunction INNER JOIN content ON 
    content.content_id = likefunction.content_idx WHERE likefunction.id = ?`
    sql_pool.query(sql_getlike, [id], (err_get, rows_get, result_get) => {
        if (err_get)
            console.log(err_get)
        else
            res.send(rows_get)
    })
})

module.exports = router