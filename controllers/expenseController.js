import fs from "fs";
import Expense from "../models/Expense.js";
import { extractTextFromImage } from "../services/ocrService.js";
import { analyzeInvoiceText, generateExpenseInsights } from "../services/geminiService.js";
import { validateExpenseInput } from "../utils/validators.js";

const buildImageUrl = (req, filename) => `${req.protocol}://${req.get("host")}/uploads/${filename}`;

export const createExpense = async (req, res, next) => {
  try {
    const errors = validateExpenseInput(req.body);
    if (errors.length) {
      res.status(400);
      throw new Error(errors.join(", "));
    }

    const expense = await Expense.create({
      shopName: req.body.shopName,
      amount: req.body.amount,
      date: req.body.date,
      category: req.body.category,
      notes: req.body.notes || "",
      source: "manual"
    });

    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

export const uploadAndExtractExpense = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error("Invoice image is required");
    }

    let ocrText = "";
    try {
      ocrText = await extractTextFromImage(req.file.path);
    } catch (error) {
      res.status(422);
      throw new Error("Could not read this invoice image. Please upload a clearer bill or enter the expense manually.");
    }

    if (!ocrText) {
      res.status(422);
      throw new Error("No readable text was found in this invoice image.");
    }

    const aiData = await analyzeInvoiceText(ocrText);
    const payload = {
      ...aiData,
      imageUrl: buildImageUrl(req, req.file.filename),
      originalFileName: req.file.originalname,
      ocrText,
      source: "upload"
    };

    const errors = validateExpenseInput(payload);
    if (errors.length) {
      res.status(422);
      throw new Error(`OCR extracted incomplete data: ${errors.join(", ")}`);
    }

  // Instead of persisting directly, send extracted data back for client-side form auto-population
  res.status(200).json({ success: true, data: payload });
  // Note: client should handle subsequent submission to create the expense record
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path) && res.statusCode >= 400) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
};

export const getExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find().sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    next(error);
  }
};

export const getExpenseById = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      res.status(404);
      throw new Error("Expense not found");
    }
    res.json(expense);
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req, res, next) => {
  try {
    const errors = validateExpenseInput(req.body);
    if (errors.length) {
      res.status(400);
      throw new Error(errors.join(", "));
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        shopName: req.body.shopName,
        amount: req.body.amount,
        date: req.body.date,
        category: req.body.category,
        notes: req.body.notes || ""
      },
      { new: true, runValidators: true }
    );

    if (!expense) {
      res.status(404);
      throw new Error("Expense not found");
    }

    res.json(expense);
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      res.status(404);
      throw new Error("Expense not found");
    }
    res.json({ message: "Expense removed successfully", id: req.params.id });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req, res, next) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const categoryTotals = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    const monthlyTotals = expenses.reduce((acc, expense) => {
      const key = new Date(expense.date).toLocaleString("en-IN", { month: "short", year: "numeric" });
      acc[key] = (acc[key] || 0) + expense.amount;
      return acc;
    }, {});

    const insights = await generateExpenseInsights(expenses.slice(0, 80));

    res.json({
      totalExpenses,
      count: expenses.length,
      recentBills: expenses.slice(0, 5),
      categoryStats: Object.entries(categoryTotals).map(([category, amount]) => ({ category, amount })),
      monthlyExpenses: Object.entries(monthlyTotals).map(([month, amount]) => ({ month, amount })),
      expenseTrends: expenses
        .slice()
        .reverse()
        .map((expense) => ({
          date: new Date(expense.date).toLocaleDateString("en-IN"),
          amount: expense.amount,
          category: expense.category
        })),
      insights
    });
  } catch (error) {
    next(error);
  }
};
