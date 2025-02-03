import { Task } from "@/types";
import { useSortable } from "@dnd-kit/sortable";
import { Card, CardContent } from "../ui/card";
import { format, isToday, parseISO } from 'date-fns';
import TaskActions from "./TaskAction";

import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
import { useState } from "react";
import TaskModal from "./modal/TaskModal";

interface TaskCardProps {
  task: Task;
  setTasks: React.Dispatch<React.SetStateAction<{
    todo?: Task[];
    inprogress?: Task[];
    completed?: Task[];
  }>>;
  isDragging?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  setTasks, 
  isDragging = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: task.id,
  });

  const formattedDate = isToday(parseISO(task.dueDate))
    ? 'Today'
    : format(parseISO(task.dueDate), 'dd MMM yyyy');

  const handleEdit = () => {
    setIsCreateModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      // Remove task from local state
      setTasks((prev) => {
        const updatedTasks = { ...prev };
        const statusKey = task.status.toLowerCase().replace('-', '') as 'todo' | 'inprogress' | 'completed';

        if (updatedTasks[statusKey]) {
          updatedTasks[statusKey] = updatedTasks[statusKey]!.filter(
            (t) => t.id !== task.id
          );
        }

        return updatedTasks;
      });

      // Delete task from Firestore
      const taskRef = doc(db, 'tasks', task.id);
      await deleteDoc(taskRef);

      console.log('Task deleted successfully from Firebase!');
    } catch (error) {
      console.error('Error deleting task from Firebase:', error);
      
      // Optional: Rollback the local state if Firestore deletion fails
      setTasks((prev) => {
        const updatedTasks = { ...prev };
        const statusKey = task.status.toLowerCase().replace('-', '') as 'todo' | 'inprogress' | 'completed';

        if (updatedTasks[statusKey]) {
          updatedTasks[statusKey] = [...updatedTasks[statusKey]!, task];
        }

        return updatedTasks;
      });
    }

    setIsOpen(false);
  };

  const handleTaskSubmit = async (values: Partial<Task>) => {
    try {
      // Validate required fields
      if (!values.title || !values.dueDate || !values.status || !values.category) {
        throw new Error('All fields are required');
      }

      // Update local state
      setTasks((prev) => {
        const updatedTasks = { ...prev };
        const newStatusKey = values.status!.toLowerCase().replace('-', '') as 'todo' | 'inprogress' | 'completed';
        const oldStatusKey = task.status.toLowerCase().replace('-', '') as 'todo' | 'inprogress' | 'completed';

        // Remove task from old status list
        if (updatedTasks[oldStatusKey]) {
          updatedTasks[oldStatusKey] = updatedTasks[oldStatusKey]!.filter(
            (t) => t.id !== task.id
          );
        }

        // Update or add task to new status list
        const updatedTask = { ...task, ...values };
        updatedTasks[newStatusKey] = [
          ...(updatedTasks[newStatusKey] || []),
          updatedTask
        ];

        return updatedTasks;
      });

      // Update task in Firestore
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, { 
        ...values,
        activities: [
          ...(task.activities || []),
          {
            action: 'Task Updated',
            timestamp: new Date().toISOString(),
            performedBy: 'current_user_id' // Replace with actual user ID
          }
        ]
      });

      console.log('Task updated successfully in Firebase!');
    } catch (error) {
      console.error('Error updating task:', error);

      // Rollback local state if update fails
      setTasks((prev) => {
        const updatedTasks = { ...prev };
        const oldStatusKey = task.status.toLowerCase().replace('-', '') as 'todo' | 'inprogress' | 'completed';

        if (updatedTasks[oldStatusKey]) {
          updatedTasks[oldStatusKey] = [...updatedTasks[oldStatusKey]!, task];
        }

        return updatedTasks;
      });
    }

    setIsCreateModalOpen(false);
  };

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
    <> 
      <TaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleTaskSubmit}
        initialData={task}
        mode="edit"
      />
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        style={style}
        className={`${isDragging ? 'opacity-50' : ''}`}
      >
        <Card className="bg-white cursor-grab">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium">{task.title}</h3>
              <TaskActions onEdit={handleEdit} onDelete={handleDelete}  />
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>{task.category}</span>
              <span>{formattedDate}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};  