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
var dbo;

app.use(bodyParser.json())

MongoClient.connect(process.env.MONGO_URL, function(err, db) {
    if (err) throw err;
    dbo = db.db("pez");


    app.listen(process.env.PORT || 3000, () => {
        console.log('listening on 3000')
    })
});


// Twilio

// get all numbers
async function queryNumbers() {
    const results = await callers.calls.list()
    .then(calls => calls.forEach(c => callArr.push(c.from)));
    await getNumbers();
};

// filter 
function getNumbers() {
    uniqueArray = callArr.filter(function(item, pos) {
        return callArr.indexOf(item) == pos;
    })

    for(let i = 0; i < uniqueArray.length; i++) {
        // insertNumber(uniqueArray[i]);
        
        console.log(i, ': ',uniqueArray[i]);
    }
    return uniqueArray;
};

// Load db
function insertNumber(number) {
    let newDate = new Date();
    let data = { 
        phoneNumber: number,
        date: newDate
    };

    dbo.collection("numbers").insertOne(data, function(err, res) {
        if (err) throw err;
    });
};

// sends text messages 
function sendText(number) {
    callers.messages
    .create({
        body:  'PeZ - Antitrust 2020:  \n \n https://pezsociety.bandcamp.com/',
        from: '+19528003312',
        to: number
     })
    .then(message => console.log(message.sid));
}   



// Routes

// get all numbers 
app.get('/phoneNumber', (req, res) => {
    try {
        dbo.collection("numbers").find({}).toArray(function(err, result) {
            if (err) throw err;
            res.send(result)
            console.log(result);
        });
    } catch (err) {
        next(err)
    }
})

// insert numbers intodb
app.post('/phoneNumber/:id', (req, res, next) => {
    try {
        const phoneNumber = req.params.id;
        const newDate = new Date();
        const search = { 
            phoneNumber: phoneNumber
        };
        const data = { $set: {phoneNumber: phoneNumber, date: newDate } };

        dbo.collection("numbers").updateOne(search, data, { upsert: true }, function(err, res) {
            if (err) throw err;
        });
        res.sendStatus(200);
      } catch (err) {
        next(err)
    }
});

// delete number
app.delete('/phoneNumber/:id', (req, res, next) => {
    try {
        var id = req.params.id;
        console.log(id)
        dbo.collection("numbers").remove({
            phoneNumber: id
        })
        res.sendStatus(200);
      } catch (err) {
        next(err)
    }
});

const testArr = ['+13522354609', '+13528702887', '+13522818053', '+19044421242']
// get all numbers 
app.get('/sendTexts', (req, res) => {
    try {
        // dbo.collection("numbers").find({}).toArray(function(err, result) {
        //     if (err) throw err;
        //     res.send(result)
        //     console.log(result);
        // });
        testArr.forEach((num) => {
            sendText(num)
            // console.log(num);
        })
    } catch (err) {
        next(err)
    }
})





