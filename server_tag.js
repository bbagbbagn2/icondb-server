const express = require('express')
const router = express.Router()
const sql_pool = require('./src/mysql')

router.post('/tag_insert', (req, res) => {
    const content_id = req.body.content_id
    const tag_context = req.body.tag_context

    const sql_InsertHash = "INSERT INTO Hash(Hashtag) VALUES ('" + tag_context + "')"
    sql_pool.query(sql_InsertHash, (err_InsertHash, result_InsertHash) => {
        const sql_Hashtag = 'SELECT * FROM Hash WHERE Hashtag = ?'
        sql_pool.query(sql_Hashtag, [tag_context], (err_Hash, rows_Hash, result_Hash) => {
            const Hash_idx = rows_Hash[0].Hash_id
            const sql_content_tag = 'INSERT INTO content_has_hash(content_idx, Hash_idx) VALUES (?,?)'
            sql_pool.query(sql_content_tag, [content_id, Hash_idx], (err_content_tag, result_content_tag) => {
                if (err_content_tag)
                    res.send("duplication")
                else
                    res.send(result_content_tag)
            })
        })
    })
})

router.post('/tag_search', (req, res) => {
    const search_tag = req.body.Hashtag
    const sql_Hashtag = 'SELECT Hash_id FROM Hash WHERE Hashtag = ?'
    sql_pool.query(sql_Hashtag, [search_tag], (err_tag, rows_tag, result_tag) => {
        if (err_tag)
            console.log(err_tag)
        else {
            const sql_getcontent = `SELECT content.* FROM content_has_hash INNER JOIN content ON 
            content_has_hash.content_idx = content.content_id WHERE content_has_hash.Hash_idx = ?`
            sql_pool.query(sql_getcontent, [rows_tag[0].Hash_id], (err_get, rows_get, result_get) => {
                if (err_get)
                    console.log(err_get)
                else
                    res.send(rows_get)
            })
        }
    })
})

router.post('/get_tags', (req, res) => {
    const content_id = req.body.content_id
    const sql_gettag = `SELECT Hash.Hashtag FROM content_has_hash INNER JOIN Hash ON 
content_has_hash.Hash_idx = Hash.Hash_id WHERE content_has_hash.content_idx = ?`
    sql_pool.query(sql_gettag, [content_id], (err_get, rows_get, result_get) => {
        if (err_get)
            console.log(err_get)
        else
            res.send(rows_get)
    })
})

module.exports = router