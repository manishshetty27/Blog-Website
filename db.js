const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const UserSchema = new Schema({
    username: { type: String, unique: true },
    email: { type: String, unique: true },
    password: String
});

const BlogSchema = new Schema({
    userId: { type: ObjectId, ref: 'User' },
    title: String,
    paragraph: String
});

const UserModel = mongoose.model('User', UserSchema);
const BlogModel = mongoose.model('Blog', BlogSchema);

module.exports = {
    UserModel,
    BlogModel
};
