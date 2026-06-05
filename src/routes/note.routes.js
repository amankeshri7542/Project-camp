import { Router } from "express";
import {
    createNote,
    deleteNote,
    getNoteById,
    getNotes,
    updateNote,
} from "../controllers/note.controller.js";
import { validate } from "../middlewares/validator.middleware.js";
import { verifyJWT, validateProjectPermission } from "../middlewares/auth.middleware.js";
import { createNoteValidator } from "../validators/index.js";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

const router = Router({ mergeParams: true });

router.use(verifyJWT);

// /api/v1/projects/:projectId/notes
router
    .route("/")
    .get(validateProjectPermission(AvailableUserRole), getNotes)
    .post(
        validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
        createNoteValidator(),
        validate,
        createNote
    );

// /api/v1/projects/:projectId/notes/:noteId
router
    .route("/:noteId")
    .get(validateProjectPermission(AvailableUserRole), getNoteById)
    .put(
        validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
        createNoteValidator(),
        validate,
        updateNote
    )
    .delete(
        validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
        deleteNote
    );

export default router;
