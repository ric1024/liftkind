// fixMissingTitles.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Request = require("./models/request"); // Adjust path if needed

async function fixMissingTitles() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    // Find requests missing the 'title' field or where title is null/empty string
    const requestsWithoutTitle = await Request.find({
      $or: [{ title: { $exists: false } }, { title: null }, { title: "" }],
    });

    console.log(`Found ${requestsWithoutTitle.length} requests missing title.`);

    for (const req of requestsWithoutTitle) {
      // Generate a title - can customize this however you want
      const generatedTitle = `Request from ${req.name || "Unknown"}`;

      req.title = generatedTitle;
      await req.save();

      console.log(`Updated request ${req._id} with title: "${generatedTitle}"`);
    }

    console.log("✅ Finished updating missing titles.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error fixing titles:", err);
    process.exit(1);
  }
}

fixMissingTitles();