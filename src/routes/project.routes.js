import { Router } from "express";
import {
    addMemberToProject,
    createProject,
    deleteMember,
    deleteProject,
    getProjectById,
    getProjectMembers,
    getProjects,
    updateMemberRole,
    updateProject,
} from "../controllers/project.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT, validateProjectPermission } from "../middlewares/auth.middleware.js";
import {
    createProjectValidator,
    addMemberToProjectValidator,
} from "../validators/index.js";
import { UserRolesEnum, AvailableUserRole } from "../utils/constants.js";

const router = Router();

// verifyJWT applies to ALL routes in this file
router.use(verifyJWT);

// /api/v1/projects/
router
    .route("/")
    .get(getProjects)
    .post(createProjectValidator(), validate, createProject);

// /api/v1/projects/:projectId
router
    .route("/:projectId")
    .get(validateProjectPermission(AvailableUserRole), getProjectById)
    .put(validateProjectPermission([UserRolesEnum.ADMIN]), createProjectValidator(), validate, updateProject)
    .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteProject);

// /api/v1/projects/:projectId/members
router
    .route("/:projectId/members")
    .get(validateProjectPermission(AvailableUserRole), getProjectMembers)
    .post(validateProjectPermission([UserRolesEnum.ADMIN]), addMemberToProjectValidator(), validate, addMemberToProject);

// /api/v1/projects/:projectId/members/:userId
router
    .route("/:projectId/members/:userId")
    .put(validateProjectPermission([UserRolesEnum.ADMIN]), updateMemberRole)
    .delete(validateProjectPermission([UserRolesEnum.ADMIN]), deleteMember);

export default router;
