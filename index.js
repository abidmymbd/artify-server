const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb')
const app = express()
const port = process.env.PORT || 3000


// // MiddleWare
app.use(cors())
app.use(express.json())



const uri = "mongodb+srv://artifynewwDBuser:H9rhD5vBxhjClG4G@abid-first-curd.xb64eac.mongodb.net/?appName=ABID-FIRST-CURD"

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
})

const artworkCollection = client.db("artifyDB").collection("artworks")

app.get('/', (req, res) => {
    res.send('Hello Artify')
})

//  Get all artworks
app.get("/artworks", async (req, res) => {
    try {
        const artworks = await artworkCollection.find({}).toArray();
        res.status(200).send(artworks);
    } catch (err) {
        console.error("Error fetching artworks:", err.message);
        res.status(500).send({ message: "Failed to fetch artworks." });
    }
});


//  Add new artwork
app.post("/artworks", async (req, res) => {
    const artwork = req.body;

    if (!artwork || !artwork.title || !artwork.imageUrl) {
        return res.status(400).send({ message: "Invalid artwork data!" });
    }

    try {
        const result = await artworkCollection.insertOne(artwork);
        res.status(201).send({
            message: "Artwork added successfully!",
            id: result.insertedId,
        });
    } catch (err) {
        console.error(" Error adding artwork:", err.message);
        res.status(500).send({ message: "Failed to add artwork." });
    }
});


// 🔹 Get featured artworks (last 6 added)
app.get("/featured-artworks", async (req, res) => {
    try {
        const artworks = await artworkCollection
            .find({})
            .sort({ _id: -1 }) // sort by newest first
            .limit(6)
            .toArray();

        res.status(200).send(artworks);
    } catch (err) {
        console.error(" Error fetching featured artworks:", err.message);
        res.status(500).send({ message: "Failed to fetch featured artworks." });
    }
});



async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir)


app.listen(port, () => {
    console.log(`Artify app listening on port ${port}`)
})


