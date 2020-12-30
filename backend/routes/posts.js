const express = require('express')
const router = express.Router()
const authenticateToken = require('../middleware/auth');
const multer = require('../middleware/multer-config');
require('dotenv').config()
const fs = require('fs');
const randomstring = require("randomstring");

const pool = require('../functions/db-connect')

router.get('/', (req, res) => {
    try {
        async function displayPosts() {
            const client = await pool.connect()
            const databaseQuery = await client.query("SELECT * FROM posts");
            client.release()
            // console.log(databaseQuery.rows)
            const sendArray = []
            // console.log(databaseQuery.rows)

            for (post of databaseQuery.rows) {

                //here is where i convert milliseconds to time elapsed since posted
                let milliseconds = parseInt(post.time_stamp)
                let timeNow = Date.now()
                let difference = timeNow - milliseconds
                let timeElapsed = new Date(difference)

                const seconds = timeElapsed / 1000
                const minutes = seconds / 60
                const hours = minutes / 60
                const days = hours / 24
                const weeks = days / 30
                const years = days / 365

                //use a switch statement
                let measurement
                if (minutes <= 1) {
                    measurement = `Less than a minute ago`
                } else if (minutes > 1 && minutes < 2) {
                    measurement = `A minute ago`
                } else if (minutes > 2 && minutes < 60) {
                    measurement = `${Math.round(minutes)} minutes ago`
                } else if (minutes >= 60 && minutes < 120) {
                    measurement = `about an hour ago`
                } else if (minutes >= 120) {
                    measurement = `${Math.trunc(hours)} hours ago`
                } else if (hours > 24) {
                    measurement = `yesterday`
                } else if (days > 2) {
                    measurement = `${Math.trunc(days)} days ago`
                } else if (weeks > 1) {
                    measurement = `${Math.trunc(weeks)} weeks ago`
                } else if (years > 1) {
                    measurement = `${Math.trunc(years)} years ago`
                }

                if (post.testarray !== null) {
                    post.testarray.forEach(function(comment, i) {
                        if (typeof comment == "string")
                            post.testarray[i] = JSON.parse(comment); });
                }

                // i send the get object here
                const getObject = {
                    caption: post.caption,
                    file_upload: post.file_upload,
                    user_id: post.user_id,
                    post_id: post.post_id,
                    time_stamp: post.time_stamp,
                    comments: post.testarray,
                    convertedTime: measurement
                }
                sendArray.push(getObject)
                // console.log(getObject)
            }
            // console.log(...databaseQuery.rows)
            res.send(sendArray.reverse())
        }
        displayPosts();
    } catch (error) {
        res.status(404).json('could not GET items!')
        return [];
    }
});

router.post('/posts', authenticateToken, (req, res) => {
    multer(req, res, function (err) {
        if (err) {
            res.status(404).json({error: req.fileValidationError})
            return
        }
        async function storePostInDatabase() {
            try {
                const imageUrl = req.protocol + '://' + req.get('host') + '/uploads/' + req.file.filename
                const postIdRandStr = randomstring.generate(16);
                const timestamp = new Date()
                const timestampMilliseconds = timestamp.getTime()

                const client = await pool.connect()
                const databaseQuery = await client.query(`INSERT INTO posts (caption, user_id, file_upload, post_id, time_stamp) VALUES ('${req.body.caption}', '${req.body.userId}', '${imageUrl}', '${postIdRandStr}', '${timestampMilliseconds}') RETURNING post_id;`)
                client.release()

                const postId = databaseQuery.rows[0].post_id
                res.json({
                    postId: postId,
                    status: 'post submitted sucessfully'
                })
            } catch (error) {
                console.log(error)
                res.status(404).json({error: 'did you fill out all fields and upload a gif?'})
            }
        }
        storePostInDatabase()
    })
})

router.put('/posts', authenticateToken, (req, res) => {
    multer(req, res, function (err) {
        if (err) {
            res.status(404).json({error: req.fileValidationError})
            return
        }
        async function modifyPost() {
            try {
                const decodedUserId = res.locals.testing
                const imageUrl = req.protocol + '://' + req.get('host') + '/uploads/' + req.file.filename
                const client = await pool.connect()
                const result = await pool.query(`SELECT user_id FROM posts WHERE post_id = '${req.body.postId}'`)
                const databaseId = result.rows[0].user_id
                // console.log(databaseId)
                // console.log(req.body)

                //database variable needs to be declared to compare decodedId
                if (databaseId === decodedUserId) {
                    await client.query(`UPDATE posts SET caption = '${req.body.caption}', file_upload = '${imageUrl}' WHERE post_id = '${req.body.postId}';`)
                    client.release()
                    res.json({
                        status: 'post modified sucessfully'
                    })
                } else {
                    res.status(403).json({
                        error: error
                    })
                }
            } catch (error) {
                console.log(error)
                res.status(404).json({error: 'Are all fields filled out and image uploaded?'})
            }
        }
        modifyPost()
    })
})

router.delete('/posts', authenticateToken, (req, res) => {
    async function deletePost() {
        try {
            const decodedUserId = res.locals.testing
            const client = await pool.connect()
            const result = await client.query(`SELECT * FROM posts WHERE post_id = '${req.body.postId}'`)
            const databaseId = result.rows[0].user_id
            const databaseUpload = result.rows[0].file_upload
            const filename = databaseUpload.split('/uploads/')[1]
            //database variable is declared at top of page and passed globally
            if (databaseId === decodedUserId) {
                const postId = req.body.postId
                await client.query(`DELETE FROM posts WHERE post_id = '${postId}';`)
                client.release()
                fs.unlink('uploads/' + filename, (err) => {
                    if (err) throw err;
                });
                res.json({
                    message: 'post deleted successfully'
                })
            } else {
                res.status(403).json({
                    error: 'You are not authorised to delete this post'
                })
            }
        } catch (error) {
            console.log(error)
        }
    }
    deletePost()
})

module.exports = router