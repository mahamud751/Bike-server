const express = require('express')
const app = express()
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;
const { query } = require('express');
const admin = require("firebase-admin");
require('dotenv').config();
const { MongoClient } = require('mongodb');


const port = process.env.PORT || 5000

const serviceAccount = require('./first-project-fab11-firebase.json')

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j095x.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
console.log(uri)

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
    if (req.headers?.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];

        try {
            const decodedUser = await admin.auth().verifyIdToken(token);
            req.decodedEmail = decodedUser.email;
        }
        catch {

        }

    }
    next();
}


async function run() {
    try {
        await client.connect()
        const database = client.db('bikeDb')
        const bikeCollection = database.collection('products')
        const bookingCollection = database.collection('booking')
        const reviewCollection = database.collection('review')
        const userCollection = database.collection('users')


        app.post('/products', async (req, res) => {
            const products = req.body
            const result = await bikeCollection.insertOne(products)
            res.json(result)
        })
        app.get('/products', async (req, res) => {
            const cursor = bikeCollection.find({})
            const result = await cursor.toArray()
            res.json(result)
        })
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await bikeCollection.findOne(query)
            res.json(result)
        })
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await bikeCollection.deleteOne(query)
            res.json(result)
        })
        app.get('/booking', async (req, res) => {
            const cursor = bookingCollection.find({})
            const result = await cursor.toArray()
            res.json(result)
        })
        app.post('/booking', async (req, res) => {
            const user = req.body
            const result = await bookingCollection.insertOne(user)
            res.json(result)
        })

        app.get('/booking', async (req, res) => {
            const email = req.query.email
            const query = { email: email }
            const booking = bookingCollection.find(query)
            const result = await booking.toArray()
            res.json(result)
        })

        app.get('/booking/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await bookingCollection.findOne(query)
            res.json(result)
        })


        app.delete('/booking/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await bookingCollection.deleteOne(query)
            res.json(result)
        })

        app.post('/review', async (req, res) => {
            const user = req.body
            const result = await reviewCollection.insertOne(user)
            res.json(result)
        })
        app.get('/review', async (req, res) => {
            const cursor = reviewCollection.find({})
            const result = await cursor.toArray()
            res.json(result)
        })

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })
        app.post('/users', async (req, res) => {
            const user = req.body
            const result = await userCollection.insertOne(user)
            res.json(result)
        })
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });
        app.put('/users/admin', verifyToken, async (req, res) => {
            const user = req.body;
            const requester = req.decodedEmail;
            if (requester) {
                const requesterAccount = await userCollection.findOne({ email: requester });
                if (requesterAccount.role === 'admin') {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: 'admin' } };
                    const result = await userCollection.updateOne(filter, updateDoc);
                    res.json(result);
                }
            }
            else {
                res.status(403).json({ message: 'you do not have access to make admin' })
            }

        })

    }
    finally {
        // await client.close()
    }
}
run().catch(console.dir)

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`bike:${port}`)
})