require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let artworkCollection;
let favoritesCollection;

app.get('/', (req, res) => {
    res.send('Hello Artify');
});

// Get all artworks
app.get("/artworks", async (req, res) => {
    try {
        const search = req.query.search?.trim().toLowerCase();
        const email = req.query.email;
        let query = { visibility: "Public" };
        if (email) query.userEmail = email;

        const allArtworks = await artworkCollection.find(query).toArray();
        const filteredArtworks = search
            ? allArtworks.filter((art) =>
                art.title.toLowerCase().includes(search)
            )
            : allArtworks;

        res.send(filteredArtworks);
    } catch (err) {
        console.error("Error fetching artworks:", err.message);
        res.send({ message: "Failed to fetch artworks." });
    }
});

// Add new artwork
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
        console.error("Error adding artwork:", err.message);
        res.send({ message: "Failed to add artwork." });
    }
});

// Get featured artworks (last 6 added)
app.get("/featured-artworks", async (req, res) => {
    try {
        const artworks = await artworkCollection
            .find({})
            .sort({ _id: -1 })
            .limit(6)
            .toArray();

        res.send(artworks);
    } catch (err) {
        console.error("Error fetching featured artworks:", err.message);
        res.send({ message: "Failed to fetch featured artworks." });
    }
});

// Get single artwork
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

// Delete an artwork
app.delete("/artworks/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const result = await artworkCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return res.send({ message: "Artwork not found" });
        }
        res.send({ message: "Artwork deleted successfully" });
    } catch (err) {
        console.error(err);
        res.send({ message: "Failed to delete artwork" });
    }
});

// Update an artwork
app.put("/artworks/:id", async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;

    try {
        const result = await artworkCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedData }
        );

        if (result.modifiedCount === 0) {
            return res.send({ message: "No changes made or artwork not found" });
        }

        res.send({ message: "Artwork updated successfully" });
    } catch (err) {
        console.error(err);
        res.send({ message: "Failed to update artwork" });
    }
});


// Like an artwork
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

        if (!result.value) return res.send({ message: '' });

        res.send({ likes: result.value.likes });
    } catch (err) {
        console.error(err);
        res.send({ message: "" });
    }
});

// Add to Favorites
app.post("/favorites", async (req, res) => {
    try {
        const favorite = req.body;
        console.log("Received favorite:", favorite);

        if (!favorite.artworkId || !favorite.userEmail) {
            return res.send({ message: "Missing required data" });
        }

        const exists = await favoritesCollection.findOne({
            artworkId: favorite.artworkId,
            userEmail: favorite.userEmail
        });

        const result = await favoritesCollection.insertOne(favorite);
        console.log("Inserted favorite:", result.insertedId);

        res.send({ message: "Added to favorites!" });
    } catch (err) {
        console.error("Error adding favorite:", err);
        res.send({ message: "Failed to add favorite" });
    }
});

// Get all favorites by user email
app.get("/favorites/:email", async (req, res) => {
    const { email } = req.params;
    console.log("Fetching favorites for:", email);

    try {
        const favorites = await favoritesCollection.find({ userEmail: email }).toArray();
        console.log("Found favorites:", favorites.length);
        res.send(Array.isArray(favorites) ? favorites : []);
    } catch (err) {
        console.error("Error fetching favorites:", err);
        res.send([]);
    }
});

// Delete from favorites
app.delete("/favorites/:id", async (req, res) => {
    const { id } = req.params;
    const result = await favoritesCollection.deleteOne({ _id: new ObjectId(id) });
    res.send({ deletedCount: result.deletedCount });
});

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
});




// MongoDB connection
async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const db = client.db("artifyDB");
        artworkCollection = db.collection("artworks");
        favoritesCollection = db.collection("favorites");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Artify app listening on port ${port}`);
});
