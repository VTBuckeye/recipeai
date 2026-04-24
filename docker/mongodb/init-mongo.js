// Initialize MongoDB database and create indexes
db = db.getSiblingDB('recipeai');

// Create collections
db.createCollection('users');
db.createCollection('recipes');

// Create indexes for users
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ supertokensUserId: 1 }, { unique: true });

// Create indexes for recipes
db.recipes.createIndex({ userId: 1 });
db.recipes.createIndex({ title: 'text', description: 'text', 'tags': 'text' });
db.recipes.createIndex({ isPublic: 1 });
db.recipes.createIndex({ createdAt: -1 });
db.recipes.createIndex({ 'ingredients.name': 1 });

print('MongoDB initialization completed');
