"use client";

import { useState, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { getDB } from "@/core/db";
import {
  createTask,
  updateTask,
  completeTask,
  uncompleteTask,
  deleteTask,
  type CreateTaskInput,
} from "@/services/database/tasks";
import type { Task } from "@/core/types";
import toast from "react-hot-toast";

export function useTasks(placeId?: string) {
  const [loading, setLoading] = useState(false);

  const tasks: Task[] = useLiveQuery(
    () => {
      const db = getDB();
      if (placeId) {
        return db.tasks.where("placeId").equals(placeId).sortBy("createdAt");
      }
      return db.tasks.orderBy("createdAt").toArray();
    },
    [placeId],
    []
  ) ?? [];

  const addTask = useCallback(async (input: CreateTaskInput): Promise<Task | null> => {
    setLoading(true);
    try {
      const task = await createTask(input);
      toast.success("Task added");
      return task;
    } catch {
      toast.error("Failed to add task");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const editTask = useCallback(
    async (id: string, updates: Partial<Omit<Task, "id" | "createdAt">>): Promise<boolean> => {
      try {
        await updateTask(id, updates);
        return true;
      } catch {
        toast.error("Failed to update task");
        return false;
      }
    },
    []
  );

  const toggleTask = useCallback(async (task: Task): Promise<void> => {
    try {
      if (task.completed) {
        await uncompleteTask(task.id);
      } else {
        await completeTask(task.id);
      }
    } catch {
      toast.error("Failed to update task");
    }
  }, []);

  const removeTask = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteTask(id);
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  }, []);

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks  = tasks.filter((t) => t.completed);

  return { tasks, incompleteTasks, completedTasks, loading, addTask, editTask, toggleTask, removeTask };
}
