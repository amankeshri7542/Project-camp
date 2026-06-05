import { Router } from "express";
import {
    createSubTask,
    createTask,
    deleteSubTask,
    deleteTask,
    getTaskById,
    getTasks,
    updateSubTask,
    updateTask,
} from "../controllers/task.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT, validateProjectPermission } from "../middlewares/auth.middleware.js";
import { createTaskValidator, createSubTaskValidator } from "../validators/index.js";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router({ mergeParams: true });

router.use(verifyJWT);

// /api/v1/projects/:projectId/tasks
router
    .route("/")
    .get(validateProjectPermission(AvailableUserRole), getTasks)
    .post(
        validateProjectPermission(AvailableUserRole),
        upload.array("attachments", 5),
        createTaskValidator(),
        validate,
        createTask
    );

// /api/v1/projects/:projectId/tasks/:taskId
router
    .route("/:taskId")
    .get(validateProjectPermission(AvailableUserRole), getTaskById)
    .put(
        validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
        upload.array("attachments", 5),
        createTaskValidator(),
        validate,
        updateTask
    )
    .delete(
        validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
        deleteTask
    );

// /api/v1/projects/:projectId/tasks/:taskId/subtasks
router
    .route("/:taskId/subtasks")
    .post(
        validateProjectPermission(AvailableUserRole),
        createSubTaskValidator(),
        validate,
        createSubTask
    );

// /api/v1/projects/:projectId/tasks/subtasks/:subTaskId
router
    .route("/subtasks/:subTaskId")
    .put(validateProjectPermission(AvailableUserRole), updateSubTask)
    .delete(validateProjectPermission(AvailableUserRole), deleteSubTask);

export default router;
