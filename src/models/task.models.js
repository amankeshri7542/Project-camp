import mongoose, { Schema } from "mongoose";
import { AvailableTaskStatus, TaskStatusEnum } from "../utils/constants.js";

const taskSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: String,
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            enum: AvailableTaskStatus,
            default: TaskStatusEnum.TODO,
        },
        attachments: {
            type: [
                {
                    url: { type: String },
                    mimetype: { type: String },
                    size: { type: Number },
                },
            ],
            default: [],
        },
    },
    { timestamps: true }
);

export const Task = mongoose.model("Task", taskSchema);
