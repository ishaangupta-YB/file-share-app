const connectDB = require('./db/conn');
const fileModel = require('./db/models/file')
const fs = require('fs')

connectDB();

async function fetchData(){
    const expiryDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const filesToDelete = await fileModel.find({ createdAt: { $lt: expiryDate } })
    if(filesToDelete.length) {
        for(const i of filesToDelete){
            try{
                try{
                    fs.unlinkSync(i.path);
                }catch(err){
                    console.log(err) 
                }
                const checkDelete = await fileModel.deleteOne(i);
                if(!checkDelete) {
                    console.log('File not deleted')
                    continue
                } 
                console.log('Files Deleted') 
            }catch(err){
                console.log(err)
            }
        }
    }
}

fetchData().then(process.exit);