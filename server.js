const express = require('express')
const path = require('path')
const multer = require('multer')
const {v4: uuid4} = require('uuid')
const crypto = require('crypto');
const fs = require('fs')
const rateLimit = require('express-rate-limit'); 
const dotenv = require('dotenv');

const result = dotenv.config();
const connectDB = require('./db/conn');
const fileModel = require('./db/models/file')

const app = express()

connectDB();

if (result.error) {
    throw result.error;
}

const PORT = process.env.PORT || 8080

const limiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 10, 
    message: 'Too many file uploads from this IP, please try again later.',
});
  
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use('/upload/files',limiter);

const viewsPath = path.join(__dirname, './views');
app.set('views', viewsPath);
app.set('view engine', 'ejs');

const uploadDirectory = 'uploads/';
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory);
}

let storage = multer.diskStorage({
    destination: (req,file,callback) => callback(null,'uploads/'),
    filename: (req,file,callback) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random()*1E9)}${path.extname(file.originalname)}`;
        callback(null,uniqueName)
    }
})

const upload = multer({
    storage: storage,
    limit: {fileSize: 1000000*100 }
}).single('myfile');

const encryptionKey = process.env.ENCRYPTION_KEY  
const encryptionIV = process.env.ENCRYPTION_IV

if (!encryptionKey || !encryptionIV) {
  throw new Error('Encryption key or IV is missing from the environment variables.');
}

const algorithm = 'aes-256-cbc';

function encrypt(buffer) {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey, 'hex'), Buffer.from(encryptionIV, 'hex'));
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return encrypted;
}

function decrypt(buffer) {
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey, 'hex'), Buffer.from(encryptionIV, 'hex'));
  const decrypted = Buffer.concat([decipher.update(buffer), decipher.final()]);
  return decrypted;
}
 
function formatExpiryTime(hours, minutes) {
    const totalMinutes = hours * 60 + minutes;
    const remainingMinutes = (24 * 60 - totalMinutes) % (24 * 60);
    if (remainingMinutes < 0) return 'This download link has expired.';
    const remainingHours = Math.floor(remainingMinutes / 60);
    const remainingMinutesPart = remainingMinutes % 60;
    const formattedHours = remainingHours > 0 ? `${remainingHours} hour${remainingHours > 1 ? 's' : ''}` : '';
    const formattedMinutesPart = remainingMinutesPart > 0 ? `${remainingMinutesPart} minute${remainingMinutesPart > 1 ? 's' : ''}` : '';
    if (formattedHours && formattedMinutesPart) return `Link expires in ${formattedHours} and ${formattedMinutesPart}`;
    else if (formattedHours) return `Link expires in ${formattedHours}`;
    else if (formattedMinutesPart) return `Link expires in ${formattedMinutesPart}`;
    else return `Link expires in ${formattedHours}`;  
}

function formatFileSize(sizeInBytes) {
    const KB = 1024;
    const MB = KB * 1024;
    const GB = MB * 1024;
    const TB = GB * 1024;

    if (sizeInBytes < KB) return sizeInBytes + ' Bytes';
    else if (sizeInBytes < MB) return (sizeInBytes / KB).toFixed(2) + ' KB';
    else if (sizeInBytes < GB) return (sizeInBytes / MB).toFixed(2) + ' MB';
    else if (sizeInBytes < TB)  return (sizeInBytes / GB).toFixed(2) + ' GB';
    else return (sizeInBytes / TB).toFixed(2) + ' TB';
}

app.get('/', (req,res) => {
    res.status(200).render('home')
})

app.post('/upload/files', (req,res) => {   
    upload(req,res, async (err) => { 
        if(!req.file) return res.status(403).render('home',{message:'No File Found!'})

        if(err) return res.status(500).render('home',{message:err.message})
    
        const {filename,path,size} = req.file
        const downloadCount=0

        const file = new fileModel({
            filename: filename,
            uuid: uuid4(),
            path: path,
            size: size,
            downloadCount: downloadCount
        }); 
        const response = await file.save();
        try{
            const fileBuffer = fs.readFileSync(path);
            const encryptedBuffer = encrypt(fileBuffer);
            fs.writeFileSync(path, encryptedBuffer);
        }catch(err){
            return res.status(201).render('home',{message:'Unexpected error'})
        }

        if(!response) return res.status(403).render('home',{message:'No Response Found'})
        return res.status(201).render('home',{publicLink:`${process.env.APP_BASE_URL}/files/${response.uuid}`})  
    });
})

app.get('/files/:uuid', async (req,res) => {
    const uuid = req.params.uuid
    try{
        const file = await fileModel.findOne({uuid:uuid})
        if(!file) return res.status(403).render('download',{error: 'Link has expired'})
        const fsize = formatFileSize(file.size)

        const currentTime = new Date();
        const timeDifference = currentTime - new Date(file.createdAt);
        const remainingHours = Math.floor(timeDifference / (1000 * 60 * 60));
        const remainingMinutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
        const formattedExpiryTime = formatExpiryTime(remainingHours, remainingMinutes);

        return res.status(403).render('download',{
            uuid: file.uuid,
            filename: file.filename,
            filesize: fsize, 
            timeLeft: formattedExpiryTime,
            downloadCount: file.downloadCount,
            downloadLink: `${process.env.APP_BASE_URL}/files/download/${file.uuid}`
        })
    }catch(err){
        return res.status(403).render('download',{error: 'Something went wrong'})
    }
})

app.get('/files/download/:uuid', async (req,res) => {
    const uuid = req.params.uuid 
    try{
        const file = await fileModel.findOne({uuid:uuid})
        if(!file) return res.status(403).render('download',{error: 'Link has expired'})
        
        const filePath = path.join(__dirname,file.path)
        try{
            const fileBuffer = fs.readFileSync(filePath);
            const decryptedBuffer = decrypt(fileBuffer);
            file.downloadCount++
            await file.save()
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename=${file.filename}`);
            res.send(decryptedBuffer); 
        }catch(err){
            return res.status(403).render('download',{error: 'Something went wrong'})
        }
        // res.download(filePath, file.filename,(err) => {
        //     if(err) return res.status(500).render('download',{error: 'Error downloading file'})
        // })
    }catch(err){
        return res.status(403).render('download',{error: 'Something went wrong'})
    }
})

app.use('*', (req,res) => {
    res.status(404).render('404')
})  

app.listen(PORT)