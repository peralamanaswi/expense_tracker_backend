import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
      maxlength: 120
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"]
    },
    date: {
      type: Date,
      required: [true, "Expense date is required"]
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      enum: ["Food", "Travel", "Shopping", "Utilities", "Healthcare", "Entertainment", "Education", "Office", "Others"]
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ""
    },
    imageUrl: {
      type: String,
      default: ""
    },
    originalFileName: {
      type: String,
      default: ""
    },
    ocrText: {
      type: String,
      default: ""
    },
    aiSummary: {
      type: String,
      default: ""
    },
    source: {
      type: String,
      enum: ["manual", "upload"],
      default: "manual"
    }
  },
  { timestamps: true, collection: "expense" }
);

export default mongoose.model("Expense", expenseSchema);
