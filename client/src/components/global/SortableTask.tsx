import { useSortable } from '@dnd-kit/sortable';
import {
  Calendar,
  CircleCheck,
  GripVertical,
  MoreHorizontal,
  MoreVertical,
} from 'lucide-react';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import TaskActions from './TaskAction';
import TaskModal from './modal/TaskModal';
import { format, isToday, parseISO } from 'date-fns';

import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';
export const SortableTask = ({ task, selected, onSelect, setTasks }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const statuses = ['TO-DO', 'IN-PROGRESS', 'COMPLETED'];
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
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
        const statusKey = task.status.toLowerCase().replace('-', '');

        updatedTasks[statusKey] = prev[statusKey].filter(
          (t) => t.id !== task.id
        );

        return updatedTasks;
      });

      // Delete task from Firestore
      const taskRef = doc(db, 'tasks', task.id);
      await deleteDoc(taskRef);

      console.log('Task deleted successfully from Firebase!');
    } catch (error) {
      console.error('Error deleting task from Firebase:', error);
    }

    setIsOpen(false); // Close modal if needed
  };

  const handleTaskSubmit = async (values) => {
    setTasks((prev) => {
      const updatedTasks = { ...prev };
      const statusKey = values.status.toLowerCase().replace('-', '');
      const oldStatusKey = task.status.toLowerCase().replace('-', '');

      // Remove from old status
      updatedTasks[oldStatusKey] = prev[oldStatusKey].filter(
        (t) => t.id !== task.id
      );

      // Add to new status
      updatedTasks[statusKey] = [
        ...(prev[statusKey] || []),
        { ...values, id: task.id },
      ];

      return updatedTasks;
    });

    try {
      const taskRef = doc(db, 'tasks', task.id); // Reference task in Firestore
      await updateDoc(taskRef, { ...values }); // Update task
      console.log('Task updated successfully in Firebase!');
    } catch (error) {
      console.error('Error updating task in Firebase:', error);
    }

    setIsCreateModalOpen(false);
  };

  const handleStatusChange = async (newStatus) => {
    const oldStatus = task.status.toLowerCase().replace('-', '');
    const newStatusKey = newStatus.toLowerCase().replace('-', '');

    setTasks((prev) => {
      const newTasks = { ...prev };
      newTasks[oldStatus] = prev[oldStatus].filter((t) => t.id !== task.id);
      newTasks[newStatusKey] = [
        ...(prev[newStatusKey] || []),
        { ...task, status: newStatus },
      ];
      return newTasks;
    });

    try {
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, { status: newStatus });
      console.log('Task status updated in Firebase!');
    } catch (error) {
      console.error('Error updating task status in Firebase:', error);
    }

    setIsOpen(false);
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
        style={style}
        {...attributes}
        className="p-3 border-b flex items-center gap-3 bg-gray-50 cursor-default justify-between"
      >
        <div className="flex items-center gap-2 w-1/3 min-w-fit">
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={selected}
            onChange={() => onSelect(task)}
          />
          <div {...listeners} className="cursor-grab">
          <GripVertical className="w-4 h-4 text-gray-400 hidden sm:block" />

          </div>

          <CircleCheck
            className={`w-4 h-4 rounded-full ${
              task.status === 'COMPLETED'
                ? 'bg-green-500 text-white'
                : 'text-gray-400'
            }`}
          />

          <div
            className={`font-medium flex-1 truncate min-w-0 ${
              task.status === 'COMPLETED' ? 'line-through text-gray-500' : ''
            }`}
          >
            {task.title}
          </div>
        </div>

        {/* Middle Section: Due Date */}
        <div className="text-sm text-gray-500 w-1/5 text-center hidden sm:block">
          {formattedDate}
        </div>

        {/* Status Dropdown */}
        <div className="relative w-1/5 text-center hidden sm:block">
          <div
            className="text-sm text-gray-500 cursor-pointer hover:text-gray-700"
            onClick={() => setIsOpen(!isOpen)}
          >
            {task.status}
          </div>
          {isOpen && (
            <div className="absolute mt-1 w-32 bg-white border border-gray-300 shadow-lg rounded-md z-10">
              {statuses.map((status) => (
                <div
                  key={status}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-200 ${
                    task.status === status ? 'font-semibold' : ''
                  }`}
                  onClick={() => {
                    handleStatusChange(status);
                    setIsOpen(false);
                  }}
                >
                  {status}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Section: Category & Actions */}
        <div className="text-sm text-gray-500 w-1/5 text-center hidden sm:block">
          {task.category}
        </div>
        <TaskActions onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </>
  );
};
