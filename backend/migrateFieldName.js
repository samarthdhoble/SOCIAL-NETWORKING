// migrateFieldName.js
import mongoose from "mongoose";
import Profile from "./models/profile.model.js";

await mongoose.connect("mongodb://localhost:27017/yourDB");

const profiles = await Profile.find();

for (const profile of profiles) {
  let updated = false;

  profile.education.forEach((edu) => {
    if (edu.filedOfStudy && !edu.fieldOfStudy) {
      edu.fieldOfStudy = edu.filedOfStudy;
      delete edu.filedOfStudy;
      updated = true;
    }
  });

  if (updated) await profile.save();
}

console.log("Migration completed ✅");
process.exit();
