// Script to fix existing recipe image URLs
// Run with: node fix-image-urls.js

const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://recipeai_user:recipeai_password@localhost:27017/recipeai?authSource=admin';

async function fixImageUrls() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('recipeai');
    const recipesCollection = db.collection('recipes');

    // Find all recipes with minio URLs
    const recipesWithMinioUrls = await recipesCollection.find({
      $or: [
        { images: { $regex: 'http://minio:' } },
        { 'instructions.imageUrl': { $regex: 'http://minio:' } }
      ]
    }).toArray();

    console.log(`Found ${recipesWithMinioUrls.length} recipes with minio URLs`);

    let updated = 0;
    for (const recipe of recipesWithMinioUrls) {
      // Fix recipe images
      const updatedImages = recipe.images.map(url =>
        url.replace('http://minio:9000', 'http://localhost:9000')
      );

      // Fix instruction step images
      const updatedInstructions = recipe.instructions.map(instruction => ({
        ...instruction,
        imageUrl: instruction.imageUrl
          ? instruction.imageUrl.replace('http://minio:9000', 'http://localhost:9000')
          : instruction.imageUrl
      }));

      // Update the recipe
      await recipesCollection.updateOne(
        { _id: recipe._id },
        {
          $set: {
            images: updatedImages,
            instructions: updatedInstructions
          }
        }
      );

      updated++;
      console.log(`Updated recipe: ${recipe.title} (${recipe._id})`);
    }

    console.log(`\nSuccessfully updated ${updated} recipes!`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixImageUrls();
