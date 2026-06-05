import mongoose from "mongoose";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectMember.models.js";
import { UserRolesEnum, AvailableUserRole } from "../utils/constants.js";

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
                status: "$project.status",
                members: 1,
                createdAt: "$project.createdAt",
                updatedAt: "$project.updatedAt",
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
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Project fetched successfully"));
});

const createProject = asyncHandler(async (req, res) => {
    const { name, description, status } = req.body;

    const project = await Project.create({
        name,
        description,
        status,
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
    const { name, description, status } = req.body;
    const { projectId } = req.params;

    const project = await Project.findByIdAndUpdate(
        projectId,
        { name, description, ...(status && { status }) },
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
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const projectMembers = await ProjectMember.aggregate([
        // Stage 1: find all members belonging to this project
        {
            $match: {
                project: new mongoose.Types.ObjectId(projectId),
            },
        },
        // Stage 2: join with users collection, project only the needed user fields
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
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
        // Stage 3: flatten user array to a single object
        {
            $addFields: {
                user: { $arrayElemAt: ["$user", 0] },
            },
        },
        // Stage 4: shape the final output
        {
            $project: {
                _id: 0,
                user: 1,
                role: 1,
                createdAt: 1,
                updatedAt: 1,
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(200, projectMembers, "Project members fetched successfully")
        );
});

const addMemberToProject = asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    const { projectId } = req.params;

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // upsert: creates the document if it doesn't exist, updates role if it does
    await ProjectMember.findOneAndUpdate(
        {
            user: new mongoose.Types.ObjectId(user._id),
            project: new mongoose.Types.ObjectId(projectId),
        },
        {
            user: new mongoose.Types.ObjectId(user._id),
            project: new mongoose.Types.ObjectId(projectId),
            role,
        },
        { new: true, upsert: true }
    );

    return res
        .status(201)
        .json(new ApiResponse(201, {}, "Project member added successfully"));
});

const updateMemberRole = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    if (!AvailableUserRole.includes(role)) {
        throw new ApiError(400, "Invalid role");
    }

    let projectMember = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(userId),
    });

    if (!projectMember) {
        throw new ApiError(404, "Project member not found");
    }

    projectMember = await ProjectMember.findByIdAndUpdate(
        projectMember._id,
        { role },
        { new: true }
    );

    if (!projectMember) {
        throw new ApiError(404, "Project member not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, projectMember, "Project member role updated successfully")
        );
});

const deleteMember = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;

    let projectMember = await ProjectMember.findOne({
        project: new mongoose.Types.ObjectId(projectId),
        user: new mongoose.Types.ObjectId(userId),
    });

    if (!projectMember) {
        throw new ApiError(404, "Member not found");
    }

    projectMember = await ProjectMember.findByIdAndDelete(projectMember._id);

    if (!projectMember) {
        throw new ApiError(404, "Member not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Project member deleted successfully"));
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
