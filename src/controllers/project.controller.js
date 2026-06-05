import mongoose from "mongoose";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectMember.models.js";
import { UserRolesEnum } from "../utils/constants.js";

const getProjects = asyncHandler(async (req, res) => {
    const projects = await ProjectMember.aggregate([
        // Stage 1: find all ProjectMember docs where the logged-in user is a member
        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        // Stage 2: join with projects collection to get full project details
        {
            $lookup: {
                from: "projects",
                localField: "project",
                foreignField: "_id",
                as: "project",
            },
        },
        // Stage 3: join with projectmembers to count total members per project
        {
            $lookup: {
                from: "projectmembers",
                localField: "project._id",
                foreignField: "project",
                as: "projectMembers",
            },
        },
        // Stage 4: calculate member count as a new field
        {
            $addFields: {
                members: { $size: "$projectMembers" },
            },
        },
        // Stage 5: flatten the project array (lookup returns array) into a single object
        {
            $unwind: "$project",
        },
        // Stage 6: shape the final output fields
        {
            $project: {
                _id: "$project._id",
                name: "$project.name",
                description: "$project.description",
                members: 1,
                createdAt: "$project.createdAt",
                createdBy: "$project.createdBy",
                role: 1,
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async (req, res) => {
    // TODO: aggregation pipeline
});

const createProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const project = await Project.create({
        name,
        description,
        createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    await ProjectMember.create({
        user: new mongoose.Types.ObjectId(req.user._id),
        project: new mongoose.Types.ObjectId(project._id),
        role: UserRolesEnum.ADMIN,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, project, "Project created successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const { projectId } = req.params;

    const project = await Project.findByIdAndUpdate(
        projectId,
        { name, description },
        { new: true }
    );

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findByIdAndDelete(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    // Clean up all project members when project is deleted
    await ProjectMember.deleteMany({ project: projectId });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Project deleted successfully"));
});

const getProjectMembers = asyncHandler(async (req, res) => {
    // TODO
});

const addMemberToProject = asyncHandler(async (req, res) => {
    // TODO
});

const updateMemberRole = asyncHandler(async (req, res) => {
    // TODO
});

const deleteMember = asyncHandler(async (req, res) => {
    // TODO
});

export {
    addMemberToProject,
    createProject,
    deleteMember,
    deleteProject,
    getProjectById,
    getProjectMembers,
    getProjects,
    updateMemberRole,
    updateProject,
};
