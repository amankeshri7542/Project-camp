import mongoose from "mongoose";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { Task } from "../models/task.models.js";
import { SubTask } from "../models/subtask.models.js";
import { Project } from "../models/project.models.js";

const getTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const tasks = await Task.find({
        project: new mongoose.Types.ObjectId(projectId),
    }).populate("assignedTo", "avatar username fullName");

    return res
        .status(200)
        .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

const createTask = asyncHandler(async (req, res) => {
    const { title, description, assignedTo, status } = req.body;
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Map uploaded files (from Multer) to the attachment schema shape
    const attachments = (req.files || []).map((file) => ({
        url: `${process.env.SERVER_URL}/images/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
    }));

    const task = await Task.create({
        title,
        description,
        project: new mongoose.Types.ObjectId(projectId),
        assignedTo: assignedTo
            ? new mongoose.Types.ObjectId(assignedTo)
            : undefined,
        status,
        assignedBy: new mongoose.Types.ObjectId(req.user._id),
        attachments,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, task, "Task created successfully"));
});

const getTaskById = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.aggregate([
        // Stage 1: find the specific task
        {
            $match: {
                _id: new mongoose.Types.ObjectId(taskId),
            },
        },
        // Stage 2: join with users to get assignedTo details
        {
            $lookup: {
                from: "users",
                localField: "assignedTo",
                foreignField: "_id",
                as: "assignedTo",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
            },
        },
        // Stage 3: join with subtasks, and within each subtask join the createdBy user
        {
            $lookup: {
                from: "subtasks",
                localField: "_id",
                foreignField: "task",
                as: "subtasks",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
                            as: "createdBy",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    // Flatten createdBy array to a single object inside each subtask
                    {
                        $addFields: {
                            createdBy: { $arrayElemAt: ["$createdBy", 0] },
                        },
                    },
                ],
            },
        },
        // Stage 4: flatten assignedTo array to a single object
        {
            $addFields: {
                assignedTo: { $arrayElemAt: ["$assignedTo", 0] },
            },
        },
    ]);

    if (!task.length) {
        throw new ApiError(404, "Task not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, task[0], "Task fetched successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { title, description, assignedTo, status } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const attachments = (req.files || []).map((file) => ({
        url: `${process.env.SERVER_URL}/images/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
    }));

    const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
            $set: {
                title: title || task.title,
                description: description ?? task.description,
                assignedTo: assignedTo
                    ? new mongoose.Types.ObjectId(assignedTo)
                    : task.assignedTo,
                status: status || task.status,
                ...(attachments.length > 0 && { attachments }),
            },
        },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    await SubTask.deleteMany({ task: new mongoose.Types.ObjectId(taskId) });
    await Task.findByIdAndDelete(taskId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Task deleted successfully"));
});

const createSubTask = asyncHandler(async (req, res) => {
    const { title } = req.body;
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const subtask = await SubTask.create({
        title,
        task: new mongoose.Types.ObjectId(taskId),
        createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    return res
        .status(201)
        .json(new ApiResponse(201, subtask, "Subtask created successfully"));
});

const updateSubTask = asyncHandler(async (req, res) => {
    const { subTaskId } = req.params;
    const { title, isCompleted } = req.body;

    const subtask = await SubTask.findById(subTaskId);
    if (!subtask) {
        throw new ApiError(404, "Subtask not found");
    }

    const updatedSubTask = await SubTask.findByIdAndUpdate(
        subTaskId,
        {
            $set: {
                title: title || subtask.title,
                isCompleted: isCompleted !== undefined ? isCompleted : subtask.isCompleted,
            },
        },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedSubTask, "Subtask updated successfully"));
});

const deleteSubTask = asyncHandler(async (req, res) => {
    const { subTaskId } = req.params;

    const subtask = await SubTask.findById(subTaskId);
    if (!subtask) {
        throw new ApiError(404, "Subtask not found");
    }

    await SubTask.findByIdAndDelete(subTaskId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Subtask deleted successfully"));
});

export {
    createSubTask,
    createTask,
    deleteSubTask,
    deleteTask,
    getTaskById,
    getTasks,
    updateSubTask,
    updateTask,
};
