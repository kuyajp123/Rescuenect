import mongoose, { Schema, Document, Model } from "mongoose";

interface UserDocument extends Document {
    userid: string;
    email: string;
    firstName: string;
    lastName?: string;
    name?: string;
    birthDate?: string;
    picture: string;
}

const userSchema: Schema<UserDocument> = new Schema<UserDocument>({
    userid: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String },
    name: { type: String },
    birthDate: { type: String },
    picture: { type: String, required: true },
});

export default mongoose.model<UserDocument>("User", userSchema);