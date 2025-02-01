import { UniqueIdentifier } from "@dnd-kit/core";

export type DNDType = {
  id: UniqueIdentifier;
  title: string;
  items: TaskItem[];
};

export type TaskItem = {
  id: UniqueIdentifier;
  title: string;
  description: string;
  assignedTo: string;
  priority: string;
  dueDate: string;
};

export interface Task {
  id: number;
  title: string;
  category: string;
  dueDate: string;
}

export interface Column {
  id: string;
  title: string;
  bgColor: string;
  items: Task[];
}