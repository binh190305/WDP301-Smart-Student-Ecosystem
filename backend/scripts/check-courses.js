const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const Course = mongoose.model('Course', new mongoose.Schema({ name: String, code: String, major: String }));
  const Lesson = mongoose.model('Lesson', new mongoose.Schema({ course: Object, title: String, content: String, order: Number }));
  const courses = await Course.find({}).lean();
  console.log('Total courses:', courses.length);
  for (const c of courses) {
    const count = await Lesson.countDocuments({ course: c._id });
    console.log(`Course [${c.code}] ${c.name} (${c._id}): ${count} lessons`);
  }
  await mongoose.disconnect();
})();

