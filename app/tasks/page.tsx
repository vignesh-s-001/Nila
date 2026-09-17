"use client";

import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { usePlaces } from "@/hooks/usePlaces";
import { TaskItem } from "@/features/tasks/TaskItem";
import { TaskForm } from "@/features/tasks/TaskForm";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CreateTaskInput } from "@/services/database/tasks";
import type { Task } from "@/core/types";

export default function TasksPage() {
  const { tasks, toggleTask, removeTask, addTask, editTask } = useTasks();
  const { places } = usePlaces();
  const [showAdd, setShowAdd]         = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [adding, setAdding]           = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks  = tasks.filter((t) => t.completed);

  // Group incomplete tasks by placeId
  const tasksByPlace: Record<string, typeof tasks> = {};
  const tasksByNone: typeof tasks = [];

  for (const t of incompleteTasks) {
    if (t.placeId) {
      if (!tasksByPlace[t.placeId]) tasksByPlace[t.placeId] = [];
      tasksByPlace[t.placeId].push(t);
    } else {
      tasksByNone.push(t);
    }
  }

  const handleAdd = async (input: CreateTaskInput) => {
    setAdding(true);
    await addTask(input);
    setAdding(false);
    setShowAdd(false);
  };

  return (
    <>
      <div className="flex flex-col w-full gap-space-xl pb-space-3xl animate-fade-in">
        
        {/* Top Greeting & Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg mt-space-md md:mt-0">
          <div className="flex flex-col gap-space-2xs">
            <div className="inline-flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold text-primary">Nurturing Rhythm</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">Mindful Rituals & Tasks</h1>
            <p className="font-body-md text-body-md text-secondary">Gentle steps at your own pace — honoring rest as much as doing.</p>
          </div>
          
          {/* Action */}
          <div className="flex items-center gap-space-md flex-shrink-0">
            <button 
              id="btn-add-task-global"
              className="group flex items-center gap-space-xs px-space-lg py-space-sm bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg rounded-full shadow-[0_12px_28px_-6px_rgba(158,54,92,0.3)] hover:shadow-[0_16px_32px_-4px_rgba(158,54,92,0.4)] transition-all duration-300 transform active:scale-95"
              onClick={() => setShowAdd(true)}
            >
              <span className="material-symbols-outlined text-[20px] transition-transform duration-300 group-hover:rotate-90">add</span>
              <span>Add New Intention</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-space-xl">
          {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
            <EmptyState
              emoji="✨"
              title="All clear!"
              description="You have no pending intentions. Take a deep breath."
            />
          ) : (
            <>
              {/* Tasks grouped by place */}
              {places.map((place) => {
                const placeTasks = tasksByPlace[place.id];
                if (!placeTasks || placeTasks.length === 0) return null;
                return (
                  <div key={place.id} className="flex flex-col gap-space-md">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary-container/50 text-xl">
                        {place.emoji}
                      </div>
                      <h2 className="font-title-md text-title-md text-on-surface">
                        {place.name}
                      </h2>
                      <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-secondary font-label-sm text-label-sm">
                        {placeTasks.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                      {placeTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          place={place}
                          onToggle={toggleTask}
                          onDelete={removeTask}
                          onEdit={(t) => setEditingTask(t)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Unassigned tasks */}
              {tasksByNone.length > 0 && (
                <div className="flex flex-col gap-space-md mt-space-md">
                  <h2 className="font-title-md text-title-md text-on-surface flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-secondary">spa</span>
                    General
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                    {tasksByNone.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onDelete={removeTask}
                        onEdit={(t) => setEditingTask(t)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed toggle */}
              {completedTasks.length > 0 && (
                <div className="flex flex-col gap-space-md mt-space-lg">
                  <button
                    onClick={() => setShowCompleted((p) => !p)}
                    className="font-label-md text-label-md text-left flex items-center gap-space-xs text-secondary hover:text-on-surface transition-colors w-fit px-space-sm py-1 rounded-full hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showCompleted ? "expand_more" : "chevron_right"}
                    </span>
                    Completed ({completedTasks.length})
                  </button>
                  
                  {showCompleted && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md opacity-80">
                      {completedTasks.map((task) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          place={places.find((p) => p.id === task.placeId)}
                          onToggle={toggleTask}
                          onDelete={removeTask}
                          onEdit={(t) => setEditingTask(t)}
                          showPlace
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Task sheet */}
      <BottomSheet isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add Intention">
        <TaskForm
          places={places}
          onSubmit={handleAdd}
          onCancel={() => setShowAdd(false)}
          loading={adding}
        />
      </BottomSheet>

      {/* Edit Intention sheet */}
      <BottomSheet isOpen={Boolean(editingTask)} onClose={() => setEditingTask(null)} title="Edit Intention">
        {editingTask && (
          <TaskForm
            places={places}
            initialTask={editingTask}
            onSubmit={async (input) => {
              setAdding(true);
              await editTask(editingTask.id, input);
              setAdding(false);
              setEditingTask(null);
            }}
            onCancel={() => setEditingTask(null)}
            loading={adding}
          />
        )}
      </BottomSheet>
    </>
  );
}
