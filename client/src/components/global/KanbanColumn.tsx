import { Column, Task } from "@/types";
import { SortableContext } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";

export const KanbanColumn = ({ column, tasks }: { column: Column; tasks: Task[] }) => {
  return (
    <div className="bg-gray-200 p-3">
      <div className={`${column.bgColor} px-3 py-1 rounded w-fit mb-4`}>
        {column.title}
      </div>
      <SortableContext items={tasks.map(task => task.id)}>
        <div className="space-y-4">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
};