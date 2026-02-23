const express = require('express')
const router = express.Router()
const sql_pool = require('./src/mysql')
const upload = require('./src/aws_multer').upload
const download = require('./src/aws_multer').download

router.post('/get_contents', (req, res) => {
    const id = req.body.id
    const count = req.body.count

    const sql = 'SELECT * FROM content order by content_id desc limit ?, ?'
    sql_pool.query(sql, [id, count], (err, result) => {
        if (err)
            throw err
        else
            res.send(result)
    })
})

router.post('/get_content', (req, res) => {
    const id = req.body.content_id

    const sql = 'SELECT * FROM content where content_id = ?'
    sql_pool.query(sql, [id], (err, result) => {
        if (err)
            throw err
        else
            res.send(result)
    })
})

router.post('/get_usercontent', (req, res) => {
    const id = req.body.id
    const sql_getcontent = `SELECT * FROM content WHERE user_id = ?`
    sql_pool.query(sql_getcontent, [id], (err_get, rows_get, result_get) => {
        if (err_get)
            console.log(err_get)
        else
            res.send(rows_get)
    })
})

router.post('/insert_content', upload.single('img'), (req, res) => {
    const id = req.session.sign
    const message = req.body.message
    const filename = req.filedirectory

    const sql = 'insert into content(user_id, message, filename) values (?, ?, ?)'
    sql_pool.query(sql, [id, message, filename], (err, result) => {
        if (err)
            throw err
        else
            res.send("success")
    })
})

router.post('/search', (req, res) => {
    const sql = 'SELECT * FROM content where message LIKE' + " '%" + req.body.searchbox + "%' "

    sql_pool.query(sql, (err, result) => {
        if (err)
            throw err
        else
            res.send(result)
    })
})

router.post('/content_delete', (req, res) => {
    const content_id = req.body.content_id
    const sql = 'DELETE FROM content WHERE content_id = ?'
    sql_pool.query(sql, [content_id], (err, result) => {
        if (err)
            throw err
        else
            res.send("success")
    })

    // s3.deleteObject({
    //     Bucket: 'webservicegraduationproject',
    //     Key: 'img/' + content_id + '.png'
    // }, (err, data) => {
    //     if (err) { throw err; }
    // });
})

router.post('/content_update', (req, res) => {
    const content_id = req.body.content_id
    const content_message = req.body.content_message
    const sql = 'UPDATE content SET message = ? WHERE content_id = ?'
    sql_pool.query(sql, [content_message, content_id], (err, result) => {
        if (err)
            throw err
        else
            res.send("success")
    })

    if (req.body.image != null) {
        s3.deleteObject({
            Bucket: 'webservicegraduationproject',
            Key: 'img/' + content_id + '.png'
        }, (err, data) => {
            if (err) { throw err; }
        });

        upload.single('img')
    }
})

router.get('/download/:key', (req, res) => { 
    const key = req.params.key
    download(req, res, key);
})

module.exports = router