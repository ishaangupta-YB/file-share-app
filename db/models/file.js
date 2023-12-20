const mongoose = require('mongoose')
const Schema = mongoose.Schema

const fileSchema = new Schema({
    filename: {type: String,required: true},
    path: {type: String,required: true},
    size: {type: Number,required: true},
    uuid: {type: String,required: true}, 
    downloadCount: {type: Number,required: true},
}, {timestamps:true});

const fileModel = new mongoose.model('File',fileSchema)

module.exports = fileModel;