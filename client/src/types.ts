import { UniqueIdentifier } from "@dnd-kit/core";

export interface FileUpload {
  name: string;
  url: string;
}

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
export interface Tasks {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  category: string;
  description?:string
  activities?: Array<{
    action: string;
    timestamp: string;
    performedBy: string;
  }>;
  userId?: string;
}

export interface TasksByStatus {
  [key: string]: Tasks[];
}