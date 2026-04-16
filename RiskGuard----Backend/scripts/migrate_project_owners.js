// Migration script: Convert string owner fields to ObjectId in Project documents
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from '../src/models/Project.js';
import User from '../src/models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

async function migrateOwners() {
  await mongoose.connect(MONGODB_URI);
  const projects = await Project.find({ owner: { $type: 'string' } });
  let updated = 0;

  for (const project of projects) {
    let user = null;
    // Try to find user by _id (string)
    user = await User.findById(project.owner).exec();
    // If not found, try by email
    if (!user) {
      user = await User.findOne({ email: project.owner }).exec();
    }
    if (user) {
      project.owner = user._id;
      await project.save();
      updated++;
      console.log(`Updated project ${project._id} owner to ObjectId ${user._id}`);
    } else {
      console.warn(`No matching user found for project ${project._id} owner: ${project.owner}`);
    }
  }

  console.log(`Migration complete. Updated ${updated} projects.`);
  await mongoose.disconnect();
}

migrateOwners().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
