import { Column, Task } from "@/types";
import { SortableContext } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";

export const KanbanColumn = ({ column, tasks }: { column: Column; tasks: Task[] }) => {
  return (
    <div className="bg-gray-100 rounded-lg p-3 pb-5 min-h-96">
      <div className={`${column.bgColor} px-3 py-1 rounded w-fit mb-4`}>
        {column.title}
      </div>
      <SortableContext items={tasks.map(task => task.id)}>
      {tasks && tasks.length ? (
        <div className="space-y-4">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>):(<div className="flex justify-center items-center"><h1 className="mt-14">No tasks found</h1></div>)}
      </SortableContext>
    </div>
  );
};