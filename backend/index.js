const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// const db = require('./db/master-index')
// const masterRouter = require('./routes/master-router')

const app = new express();
var router = express.Router();
const apiPort = 3333;

app.use(cors());
app.use(bodyParser());  // to use bodyParser (for text/number data transfer between clientg and server)
app.use(express.static(__dirname + '/uploads'));

// app.use(express.json());
// app.use(express.urlencoded({extended: false}));

function multerGenerator(data_type, location) {
    let storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, 'uploads/images/'))
        },
        filename: function (req, file, cb) {
            cb(null, file.originalname)
        }
    });
    var fileUploader;
    if (data_type == 'image') {
        fileUploader = multer({
            storage,
            // limits: {fileSize: 1 * 1024 * 1024}, // 1MB
            maxCount: 1000,
            // fileFilter: (req, file, cb) => {
            //     if (file.mimetype == "image/*") {
            //         cb(null, true);
            //     } else {
            //         cb(null, false);
            //         const err = new Error('Only .png, .jpg and .jpeg format allowed!')
            //         err.name = 'ExtensionError'
            //         return cb(err);
            //     }
            // },
        }).array('uploadedImages', 1000)
    }
    return fileUploader
}



// db.on('error', console.error.bind(console, 'MongoDB connection error:'))
// app.route('/api/image_upload').post(multerGenerator('image','./images'), (req, res) => {
//      res.status(200).end('Your files uploaded.');
// });
app.post('/api/image_data', (req, res) => {
    let upload_func = multerGenerator('image','uploads/images/')
    upload_func(req, res, function (err) {
       if (err instanceof multer.MulterError) {
           console.log(err.message)
            // A Multer error occurred when uploading.
            res.status(500).send({ error: { message: `Multer uploading error: ${err.message}` } }).end();
            return;
        } else if (err) {
           console.log(err.message)
            // An unknown error occurred when uploading.
            if (err.name == 'ExtensionError') {
                res.status(413).send({ error: { message: err.message } }).end();
            } else {
                res.status(500).send({ error: { message: `unknown uploading error: ${err.message}` } }).end();
            }
            return;
        }

        // Everything went fine.
        // show file `req.files`
        // show body `req.body`
        res.status(200).end('Your files uploaded.');
    })
});

app.get('/api/image_data',(req, res) => {
    res.setHeader('Content-Type', 'application/json');
    fs.readdir(path.join(__dirname, 'uploads/images/'), (err, files) => {
        res.send(files);
    });
});


app.get('/api/test', (req, res) => {
    res.status(200).end('Your files uploaded.');
});

// app.use('/api', masterRouter)

app.listen(apiPort, () => console.log(`Server running on port ${apiPort}`))