const mongoose = require('mongoose')
require('dotenv').config(); 

function connectDB() {
    mongoose.connect(process.env.MONGO_CONNECTION_URL,)
    const connection = mongoose.connection

    connection.once('open', () => {
        console.log('Database Connected')
    })

    connection.on('error', (err) => {
        console.log(`${err}`)
    })
}

module.exports = connectDB
