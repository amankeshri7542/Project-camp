import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.models.js';
import { ProjectMember } from '../models/projectMember.models.js';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        throw new ApiError(401, 'Unauthorized request');
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?.id || decodedToken?._id).select(
        '-password -refreshToken -emailVerificationToken -emailVerificationExpiration'
    );

    if (!user) {
        throw new ApiError(401, 'Invalid access token');
    }

    req.user = user;
    next();
});

// Higher-order middleware: takes an array of allowed roles, returns a middleware function.
// Must always run AFTER verifyJWT so req.user is available.
export const validateProjectPermission = (roles) =>
    asyncHandler(async (req, res, next) => {
        const { projectId } = req.params;

        if (!projectId) {
            throw new ApiError(400, "Project ID is missing");
        }

        // Fetch the ProjectMember document — this is the source of truth for the user's role.
        // We never trust the client to tell us what role they have.
        const project = await ProjectMember.findOne({
            project: new mongoose.Types.ObjectId(projectId),
            user: req.user._id,
        });

        if (!project) {
            throw new ApiError(404, "Project not found");
        }

        const givenRole = project?.role;

        // Attach the DB-verified role to req.user for downstream controllers to use
        req.user.role = givenRole;

        // Check if the user's actual role is in the list of allowed roles
        if (!roles.includes(givenRole)) {
            throw new ApiError(403, "You do not have permission to perform this action");
        }

        next();
    });
