import { Task } from "@/types";
import { useSortable } from "@dnd-kit/sortable";
import { Card, CardContent } from "../ui/card";
import { MoreHorizontal } from "lucide-react";
import { format, isToday, parseISO } from 'date-fns';
import TaskActions from "./TaskAction";

export const TaskCard = ({ task, isDragging = false }: { task: Task; isDragging?: boolean }) => {
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
      // setIsCreateModalOpen(true);
    };

const handleDelete=()=>{

}
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
  };

  return (
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
             <TaskActions onEdit={handleEdit} onDelete={handleDelete} />
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>{task.category}</span>
            <span>       {formattedDate}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};