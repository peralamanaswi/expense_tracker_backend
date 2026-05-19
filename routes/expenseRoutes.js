import express from "express";
import {
  createExpense,
  deleteExpense,
  getAnalytics,
  getExpenseById,
  getExpenses,
  updateExpense,
  uploadAndExtractExpense
} from "../controllers/expenseController.js";
import { uploadInvoice } from "../middleware/upload.js";

const router = express.Router();

router.get("/analytics", getAnalytics);
router.post("/upload", uploadInvoice.single("invoice"), uploadAndExtractExpense);
router.route("/").get(getExpenses).post(createExpense);
router.route("/:id").get(getExpenseById).put(updateExpense).delete(deleteExpense);

export default router;
