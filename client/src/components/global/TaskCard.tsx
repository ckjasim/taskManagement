import { useSortable } from "@dnd-kit/sortable";
import { Card, CardContent } from "../ui/card";
import { format, isToday, parseISO } from "date-fns";
import TaskActions from "./TaskAction";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import { useState } from "react";
import TaskModal from "./modal/TaskModal";

interface TaskCardProps {
  task: any;
  setTasks: React.Dispatch<
    React.SetStateAction<any>
  >;
  isDragging?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, setTasks, isDragging = false }) => {
  const [, setIsOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: task.id,
  });

  const formattedDate = task.dueDate
    ? isToday(parseISO(task.dueDate))
      ? "Today"
      : format(parseISO(task.dueDate), "dd MMM yyyy")
    : "No Due Date";

  const handleEdit = () => {
    setIsCreateModalOpen(true);
  };

  const handleDelete = async () => {
    try {
      setTasks((prev: any) => {
        const updatedTasks = { ...prev };
        const statusKey = task.status.toLowerCase().replace("-", "") as keyof typeof updatedTasks;
        
        if (updatedTasks[statusKey]) {
          updatedTasks[statusKey] = updatedTasks[statusKey]!.filter((t: { id: any; }) => t.id !== task.id);
        }
        return updatedTasks;
      });

      const taskRef = doc(db, "tasks", task.id);
      await deleteDoc(taskRef);

      console.log("Task deleted successfully from Firebase!");
    } catch (error) {
      console.error("Error deleting task from Firebase:", error);
      setTasks((prev: any) => {
        const updatedTasks = { ...prev };
        const statusKey = task.status.toLowerCase().replace("-", "") as keyof typeof updatedTasks;
        if (updatedTasks[statusKey]) {
          updatedTasks[statusKey] = [...updatedTasks[statusKey]!, task];
        }
        return updatedTasks;
      });
    }
    setIsOpen(false);
  };

  const handleTaskSubmit = async (values: Partial<any>) => {
    try {
      if (!values.title || !values.dueDate || !values.status || !values.category) {
        throw new Error("All fields are required");
      }

      setTasks((prev: any) => {
        const updatedTasks = { ...prev };
        const newStatusKey = values.status.toLowerCase().replace("-", "") as keyof typeof updatedTasks;
        const oldStatusKey = task.status.toLowerCase().replace("-", "") as keyof typeof updatedTasks;
        
        if (updatedTasks[oldStatusKey]) {
          updatedTasks[oldStatusKey] = updatedTasks[oldStatusKey]!.filter((t: { id: any; }) => t.id !== task.id);
        }

        const updatedTask = { ...task, ...values };
        updatedTasks[newStatusKey] = [...(updatedTasks[newStatusKey] || []), updatedTask];

        return updatedTasks;
      });

      const taskRef = doc(db, "tasks", task.id);
      await updateDoc(taskRef, {
        ...values,
        activities: [
          ...(task.activities || []),
          {
            action: "Task Updated",
            timestamp: new Date().toISOString(),
            performedBy: "current_user_id", 
          },
        ],
      });

      console.log("Task updated successfully in Firebase!");
    } catch (error) {
      console.error("Error updating task:", error);
      setTasks((prev: any) => {
        const updatedTasks = { ...prev };
        const oldStatusKey = task.status.toLowerCase().replace("-", "") as keyof typeof updatedTasks;
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
      <div ref={setNodeRef} {...attributes} {...listeners} style={style} className={`${isDragging ? "opacity-50" : ""}`}>
        <Card className="bg-white cursor-grab">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium">{task.title}</h3>
              <TaskActions onEdit={handleEdit} onDelete={handleDelete} />
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
