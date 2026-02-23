//multer 모듈 사용
const AWS = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3-transform');
const dotenv = require('dotenv') 
const path = require("path")
dotenv.config()

AWS.config.update({
    region: 'us-east-1',
    accessKeyId: process.env.AWS_ACCESSKEY,
    secretAccessKey: process.env.AWS_SECRETACCESSKEY
})

const s3 = new AWS.S3()

const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'webservicegraduationproject',
        contentType: (req, file, cb) => {
            if(path.extname(file.originalname) === '.svg')
                cb(null, 'image/svg+xml')
            else
                cb(null, 'application/octet-stream')
        },
        acl: 'public-read-write',
        key:(req, file, cb) => {
            req.filedirectory = Date.now().toString() + path.extname(file.originalname)
            cb(null, 'img/' + req.filedirectory);
        },
        limits: { fileSize: 1000 * 1000 * 10 }
    })
})

const profile_upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'webservicegraduationproject',
        contentType: (req, file, cb) => {
            if(path.extname(file.originalname) === '.svg')
                cb(null, 'image/svg+xml')
            else
                cb(null, 'application/octet-stream')
        },
        acl: 'public-read-write',
        key:(req, file, cb) => {
            req.filedirectory = Date.now().toString() + path.extname(file.originalname)
            cb(null, 'userprofile/' + req.filedirectory);
        },
        limits: { fileSize: 1000 * 1000 * 10 }
    })
})

const download = (req, res, key) => {

    const params = {
        Bucket: 'webservicegraduationproject',
        Key: 'img/' + key
    }

    res.attachment(key);
    var fileStream = s3.getObject(params).createReadStream();
    fileStream.pipe(res);
};

const svg = async(req, res, key) => {

    var convert = require('xml-js');

    const params = {
        Bucket: 'webservicegraduationproject',
        Key: 'img/' + key
    }

    const data = await s3.getObject(params).promise();

    let l1 = convert.xml2json(data.Body, {compact: true, spaces: 4})
    let l2 = convert.json2xml(l1, {compact: true, spaces: 4})

    res.header("Access-Control-Allow-Origin", "*");
    res.send({xml : l2})
};

module.exports = {
    upload: upload,
    download: download,
    svg : svg,
    profile_upload: profile_upload
}