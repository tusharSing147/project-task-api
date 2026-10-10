import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: 1,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "completed"],
      default: "todo",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    // IDs below reference MySQL rows (Prisma Project.id and User.id)
    projectId: {
      type: Number,
      required: [true, "projectId is required"],
      index: true,
    },
    userId: {
      type: Number,
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// Supports GET /api/tasks filtering + pagination for a user
taskSchema.index({ userId: 1, status: 1, priority: 1, createdAt: -1 });
taskSchema.index({ userId: 1, projectId: 1 });

export const Task = mongoose.model("Task", taskSchema);
