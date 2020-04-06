const MongoClient = require('mongodb').MongoClient;
const client = new MongoClient(process.env.MONGO_URL, { useNewUrlParser: true });
const express = require('express')
const bodyParser = require('body-parser');
const path = require('path')
require('dotenv').config({ path: path.resolve(__dirname, '.env') })
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const callers = require('twilio')(accountSid, authToken);
const callArr = [];
const app = express();
const cors = require('cors');

var dbo;

app.use(cors());
app.use(bodyParser.json());

MongoClient.connect(process.env.MONGO_URL, function(err, db) {
    if (err) throw err;
    dbo = db.db("sendText");

    app.listen(process.env.PORT || 3000, () => {
        console.log('listening on 3000')
    })
});



// Routes

// get all numbers 
app.get('/customers', (req, res, next) => {
    try {
        dbo.collection("customers").find({}).toArray(function(err, result) {
            if (err) throw err;
            res.send(result)
            console.log(result);
        });
    } catch (err) {
        next(err)
    }
})

app.get('/messages', (req, res, next) => {
    try {
        dbo.collection("messages").find({}).toArray(function(err, result) {
            if (err) throw err;
            res.send(result)
            console.log(result);
        });
    } catch (err) {
        next(err)
    }
})


// insert customer intodb
app.post('/customers', (req, res, next) => {
    try {
        const newDate = new Date();
        const search = { 
            phoneNumber: req.body.phoneNumber
        };
        const data = { $set: {
            name: req.body.name,
            phoneNumber: req.body.phoneNumber,
            dateCreated: newDate
        } };

        dbo.collection("customers").updateOne(search, data, { upsert: true }, function(err, res) {
            if (err) throw err;
        });
        res.sendStatus(200);
      } catch (err) {
        next(err)
    }
});


app.post('/sendText', async (req, res, next) => {
    try {
        const phoneNumber = req.body.phoneNumber;
        const message = req.body.message;
        sendText(phoneNumber, message);
        res.sendStatus(200);
    } catch (err) {
        next(err)
    }
})

// sends text messages 
function sendText(number, message ) {
    callers.messages
    .create({
        body:  message,
        from: '+19528003312',
        to: number
     })
    .then(message => console.log(message.sid));
}   


function getMessage() {
    try {
        dbo.collection("messages").find({}).toArray(function(err, result) {
            if (err) throw err;
            return result[0].body
        });
    } catch (err) {
        console.log(err)
    }
}

