import mongoose from "mongoose";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { Task } from "../models/task.models.js";
import { SubTask } from "../models/subtask.models.js";
import { Project } from "../models/project.models.js";

const getTasks = asyncHandler(async (req, res) => {
    // TODO
});

const createTask = asyncHandler(async (req, res) => {
    // TODO
});

const getTaskById = asyncHandler(async (req, res) => {
    // TODO
});

const updateTask = asyncHandler(async (req, res) => {
    // TODO
});

const deleteTask = asyncHandler(async (req, res) => {
    // TODO
});

const createSubTask = asyncHandler(async (req, res) => {
    // TODO
});

const updateSubTask = asyncHandler(async (req, res) => {
    // TODO
});

const deleteSubTask = asyncHandler(async (req, res) => {
    // TODO
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
