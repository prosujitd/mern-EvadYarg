require('dotenv').config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3500;
const {logger} = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler')
const cookieParser = require('cookie-parser');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');

const connectDB = require('./config/dbConnection');
const mongoose = require('mongoose')
const {logEvents } = require('./middleware/logger');

const path = require('path');

connectDB();

// Logger
app.use(logger)

app.use(cors(corsOptions));

// Parsing Cookie
app.use(cookieParser());

// Receive and Parse the JSON
app.use(express.json());

// Serve static files e.g. CSS JS Images
app.use('/', express.static(path.join(__dirname, '/public')));

app.use('/', require('./routes/root'));
app.use('/users', require('./routes/userRoutes'));
app.use('/notes', require('./routes/noteRoutes'));


app.all('*' , (req,res) => {
    res.status(404);
    if(req.accepts('html')){
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    }else if (req.accepts('json')){
        res.json({
            message: "404 Not Found"
        })
    }else{
        res.type('txt').send('404 Not Found');
    }
})

app.use(errorHandler);

mongoose.connection.once('open', () => {
    console.log(' Connected TO MongoDB')
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
      });
})


mongoose.connection.on('error', (err) => {
    console.log(err);
    logEvents(`${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`, 'mongoErrLog.log')
})


