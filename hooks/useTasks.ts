"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getTasks,
  getTasksByPlace,
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = placeId ? await getTasksByPlace(placeId) : await getTasks();
      setTasks(data);
    } catch (err) {
      console.error("useTasks refresh error:", err);
    }
  }, [placeId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTask = useCallback(async (input: CreateTaskInput): Promise<Task | null> => {
    setLoading(true);
    try {
      const task = await createTask(input);
      toast.success("Task added");
      await refresh();
      return task;
    } catch {
      toast.error("Failed to add task");
      return null;
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const editTask = useCallback(
    async (id: string, updates: Partial<Omit<Task, "id" | "createdAt">>): Promise<boolean> => {
      try {
        await updateTask(id, updates);
        await refresh();
        return true;
      } catch {
        toast.error("Failed to update task");
        return false;
      }
    },
    [refresh]
  );

  const toggleTask = useCallback(async (task: Task): Promise<void> => {
    try {
      if (task.completed) {
        await uncompleteTask(task.id);
      } else {
        await completeTask(task.id);
      }
      await refresh();
    } catch {
      toast.error("Failed to update task");
    }
  }, [refresh]);

  const removeTask = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteTask(id);
      toast.success("Task deleted");
      await refresh();
    } catch {
      toast.error("Failed to delete task");
    }
  }, [refresh]);

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks  = tasks.filter((t) => t.completed);

  return { tasks, incompleteTasks, completedTasks, loading, addTask, editTask, toggleTask, removeTask, refresh };
}
