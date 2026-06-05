import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectMember.models.js";

const getProjects = asyncHandler(async (req, res) => {
    // TODO
});

const getProjectById = asyncHandler(async (req, res) => {
    // TODO
});

const createProject = asyncHandler(async (req, res) => {
    // TODO
});

const updateProject = asyncHandler(async (req, res) => {
    // TODO
});

const deleteProject = asyncHandler(async (req, res) => {
    // TODO
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
