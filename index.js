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
        const search = req.query.search?.trim();
        const email = req.query.email;

        let query = { visibility: "Public" };

        if (email) query.userEmail = email;

        if (search) query.title = search;

        const artworks = await artworkCollection.find(query).toArray();
        res.send(artworks);
    } catch (err) {
        console.error("Error fetching artworks:", err.message);
        res.send({ message: "Failed to fetch artworks." });
    }
});



//  Add new artwork
app.post("/artworks", async (req, res) => {
    const artwork = req.body;

    if (!artwork || !artwork.title || !artwork.imageUrl) {
        return res.send({ message: "Invalid artwork data!" });
    }

    try {
        const result = await artworkCollection.insertOne(artwork);
        res.send({
            message: "Artwork added successfully!",
            id: result.insertedId,
        });
    } catch (err) {
        console.error(" Error adding artwork:", err.message);
        res.send({ message: "Failed to add artwork." });
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

        res.send(artworks);
    } catch (err) {
        console.error(" Error fetching featured artworks:", err.message);
        res.send({ message: "Failed to fetch featured artworks." });
    }
});

//// For Single page and Like //
const { ObjectId } = require("mongodb");

app.get("/artworks/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const artwork = await artworkCollection.findOne({ _id: new ObjectId(id) });
        if (!artwork) return res.send({});
        res.send(artwork);
    } catch (err) {
        console.error(err);
        res.send({ message: "Failed to fetch artwork" });
    }
});


// For Like
app.patch("/artworks/:id/like", async (req, res) => {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
        return res.send({ message: "Invalid artwork id" });
    }

    try {
        const result = await artworkCollection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $inc: { likes: 1 } },
            { returnDocument: "after" }
        );

        if (!result.value) return res.status(404).send({ message: '' });

        res.send({ likes: result.value.likes });
    } catch (err) {
        console.error(err);
        res.send({ message: "" });
    }
});

//// For Single page and Like End //

// Get total artworks by artist email
app.get("/artist/:email/artworks/count", async (req, res) => {
    const { email } = req.params;

    try {
        const count = await artworkCollection.countDocuments({ userEmail: email });
        res.send({ totalArtworks: count });
    } catch (err) {
        console.error(err);
        res.send({ message: "Failed to fetch artist's total artworks" });
    }
})


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


