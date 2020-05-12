require('dotenv').config();
const bcrypt = require('bcrypt');

const express = require('express');
const app = express();
const mongoose = require('mongoose');

app.use(express.json({limit: '5mb'}));
app.use(express.urlencoded({limit: '5mb'}));

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true, useUnifiedTopology: true })
const db = mongoose.connection;
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('connected to database'))
mongoose.set('useCreateIndex', true);

app.use(express.json())

const usersRouter = require('./routes/users')
app.use('/users', usersRouter)

const rosterRouter = require('./routes/roster')
app.use('/roster', rosterRouter)

app.get('/', (req, res) => {
   res.send('Hey')
})

app.get('*', function(req, res){
   res.send('Invalid URL');
});


app.listen(3000, () => console.log('Server started'));