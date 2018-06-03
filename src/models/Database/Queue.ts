import mongoose from "mongoose";
import moment from "moment";

export type QueueModel = {
  title: string,
  sceneName: string,
  fileName: string,
  folder: string,
};

export type QueueDocument = mongoose.Document & QueueModel;

const queueSchema = new mongoose.Schema({
  title: String,
  sceneName: String,
  fileName: String,
  folder: String
}, {timestamps: true});

queueSchema.methods.createdAtFormatted = function () {
  return moment(this.createdAt).format("YYYY-DD-MM HH:mm:ss");
};

const Queue = mongoose.model("Queue", queueSchema);

export default Queue;
