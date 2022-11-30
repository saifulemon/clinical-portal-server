const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mgz8bkj.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try{
    await client.connect();
    const serviceCollection = client.db('doctors_portal').collection('services');
    const bookingCollection = client.db('doctors_portal').collection('bookings');

    app.get('/service', async(req , res) =>{
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });
    
    app.get('/available', async(req , res) =>{
      const date = req.query.date;
      const services = await serviceCollection.find().toArray();
      const query = {date: date};
      const booked = await bookingCollection.find(query).toArray();

      services.forEach(service => {
        const serviceBookings = booked.filter(b => b.treatment === service.name);
        const updateBooke = serviceBookings.map(s => s.slot);
        const available = service.slots.filter(s => !updateBooke.includes(s));
        service.slots = available;
      })
      res.send(services);
    })

    app.post('/booking', async(req , res) =>{
      const booking = req.body;
      const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient}
      const exists = await bookingCollection.findOne(query);
      if(exists) {
        return res.send({success: false, exists})
      }
      const result = await bookingCollection.insertOne(booking);
      return res.send({success: true, result});
    });
  }
  finally {

  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello from doctor uncle!');
})

app.listen(port, () => {
  console.log(`Doctors app listening on port ${port}`)
})