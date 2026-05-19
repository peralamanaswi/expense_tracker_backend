const categories = ["Food", "Travel", "Shopping", "Utilities", "Healthcare", "Entertainment", "Education", "Office", "Others"];

export const validateExpenseInput = (payload) => {
  const errors = [];

  if (!payload.shopName || payload.shopName.trim().length < 2) {
    errors.push("Shop name must contain at least 2 characters");
  }

  const amount = Number(payload.amount);
  if (Number.isNaN(amount) || amount < 0) {
    errors.push("Amount must be a valid positive number");
  }

  const date = new Date(payload.date);
  if (!payload.date || Number.isNaN(date.getTime())) {
    errors.push("Date must be valid");
  }

  if (!categories.includes(payload.category)) {
    errors.push("Category is not supported");
  }

  return errors;
};

export const categoriesList = categories;
