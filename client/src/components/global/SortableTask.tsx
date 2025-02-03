import { useSortable } from '@dnd-kit/sortable';
import {  CircleCheck, GripVertical } from 'lucide-react';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import TaskActions from './TaskAction';
import TaskModal from './modal/TaskModal';
import { format, isToday, parseISO } from 'date-fns';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';

interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  category: string;
  activities?: Array<{
    action: string;
    timestamp: string;
    performedBy: string;
  }>;
  userId?: string;
}

interface TasksByStatus {
  todo: Task[];
  inprogress: Task[];
  completed: Task[];
  [key: string]: Task[];
}

interface SortableTaskProps {
  task: Task;
  selected: boolean;
  onSelect: (task: Task) => void;
  setTasks: React.Dispatch<React.SetStateAction<TasksByStatus>>;
}

export const SortableTask: React.FC<SortableTaskProps> = ({ task, selected, onSelect, setTasks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const statuses: Task['status'][] = ['TO-DO', 'IN-PROGRESS', 'COMPLETED'];

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const formattedDate = isToday(parseISO(task.dueDate)) ? 'Today' : format(parseISO(task.dueDate), 'dd MMM yyyy');

  const handleEdit = () => setIsCreateModalOpen(true);

  const handleDelete = async () => {
    try {
      setTasks((prev) => {
        const updatedTasks = { ...prev };
        const statusKey = task.status.toLowerCase().replace('-', '');
        updatedTasks[statusKey] = prev[statusKey].filter((t) => t.id !== task.id);
        return updatedTasks;
      });
      await deleteDoc(doc(db, 'tasks', task.id));
      console.log('Task deleted successfully from Firebase!');
    } catch (error) {
      console.error('Error deleting task from Firebase:', error);
    }
    setIsOpen(false);
  };

  const handleTaskSubmit = async (values: Partial<Task>) => {
    setTasks((prev) => {
      const updatedTasks = { ...prev };
      const oldStatusKey = task.status.toLowerCase().replace('-', '');
      const newStatusKey = values.status?.toLowerCase().replace('-', '');

      if (newStatusKey && oldStatusKey !== newStatusKey) {
        updatedTasks[oldStatusKey] = updatedTasks[oldStatusKey].filter((t) => t.id !== task.id);
        updatedTasks[newStatusKey] = [...(updatedTasks[newStatusKey] || []), { ...task, ...values }];
      } else {
        updatedTasks[oldStatusKey] = updatedTasks[oldStatusKey].map((t) => (t.id === task.id ? { ...t, ...values } : t));
      }
      return updatedTasks;
    });

    try {
      await updateDoc(doc(db, 'tasks', task.id), values);
      console.log('Task updated successfully in Firebase!');
    } catch (error) {
      console.error('Error updating task in Firebase:', error);
    }
    setIsCreateModalOpen(false);
  };

  return (
    <>
      <TaskModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleTaskSubmit} initialData={task} mode="edit" />
      <div ref={setNodeRef} style={style} {...attributes} className="p-3 border-b flex items-center gap-3 bg-gray-50 cursor-default justify-between">
        <div className="flex items-center gap-2 w-1/3 min-w-fit">
          <input type="checkbox" className="w-4 h-4" checked={selected} onChange={() => onSelect(task)} />
          <div {...listeners} className="cursor-grab">
            <GripVertical className="w-4 h-4 text-gray-400 hidden sm:block" />
          </div>
          <CircleCheck className={`w-4 h-4 rounded-full ${task.status === 'COMPLETED' ? 'bg-green-500 text-white' : 'text-gray-400'}`} />
          <div className={`font-medium flex-1 truncate min-w-0 ${task.status === 'COMPLETED' ? 'line-through text-gray-500' : ''}`}>{task.title}</div>
        </div>
        <div className="text-sm text-gray-500 w-1/5 text-center hidden sm:block">{formattedDate}</div>
        <div className="relative w-1/5 text-center hidden sm:block">
          <div className="text-sm text-gray-500 cursor-pointer hover:text-gray-700" onClick={() => setIsOpen(!isOpen)}>
            {task.status}
          </div>
          {isOpen && (
            <div className="absolute mt-1 w-32 bg-white border border-gray-300 shadow-lg rounded-md z-10">
              {statuses.map((status) => (
                <div key={status} className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-200 ${task.status === status ? 'font-semibold' : ''}`} onClick={() => setTasks((prev) => ({ ...prev, [task.status.toLowerCase()]: prev[task.status.toLowerCase()].filter((t) => t.id !== task.id), [status.toLowerCase()]: [...(prev[status.toLowerCase()] || []), { ...task, status }] }))}>
                  {status}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="text-sm text-gray-500 w-1/5 text-center hidden sm:block">{task.category}</div>
        <TaskActions onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </>
  );
};
