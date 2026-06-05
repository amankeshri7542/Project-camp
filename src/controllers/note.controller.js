import mongoose from "mongoose";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { ProjectNote } from "../models/note.models.js";
import { Project } from "../models/project.models.js";

const getNotes = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const notes = await ProjectNote.find({
        project: new mongoose.Types.ObjectId(projectId),
    }).populate("createdBy", "avatar username fullName");

    return res
        .status(200)
        .json(new ApiResponse(200, notes, "Notes fetched successfully"));
});

const createNote = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const note = await ProjectNote.create({
        content,
        project: new mongoose.Types.ObjectId(projectId),
        createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    return res
        .status(201)
        .json(new ApiResponse(201, note, "Note created successfully"));
});

const getNoteById = asyncHandler(async (req, res) => {
    const { noteId } = req.params;

    const note = await ProjectNote.findById(noteId).populate(
        "createdBy",
        "avatar username fullName"
    );

    if (!note) {
        throw new ApiError(404, "Note not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, note, "Note fetched successfully"));
});

const updateNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    const { content } = req.body;

    const note = await ProjectNote.findById(noteId);
    if (!note) {
        throw new ApiError(404, "Note not found");
    }

    const updatedNote = await ProjectNote.findByIdAndUpdate(
        noteId,
        { $set: { content } },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedNote, "Note updated successfully"));
});

const deleteNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;

    const note = await ProjectNote.findById(noteId);
    if (!note) {
        throw new ApiError(404, "Note not found");
    }

    await ProjectNote.findByIdAndDelete(noteId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Note deleted successfully"));
});

export { createNote, deleteNote, getNoteById, getNotes, updateNote };
