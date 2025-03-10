import { Column, Task } from "@/types";
import { SortableContext } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { useDroppable } from "@dnd-kit/core";

export const KanbanColumn = ({ column, tasks }: { column: Column; tasks: Task[] }) => {
  const { setNodeRef } = useDroppable({
    id: column.id
  });

  return (
    <div 
      ref={setNodeRef}
      className="bg-gray-100 rounded-lg p-3 pb-5 min-h-96"
    >
      <div className={`${column.bgColor} px-3 py-1 rounded w-fit mb-4`}>
        {column.title}
      </div>
      <SortableContext items={tasks.map(task => task.id)}>
        {tasks && tasks.length ? (
          <div className="space-y-4">
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} setTasks={function (): void {
                throw new Error("Function not implemented.");
              } } />
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
            <h1 className="text-gray-500">Drop tasks here</h1>
          </div>
        )}
      </SortableContext>
    </div>
  );
};