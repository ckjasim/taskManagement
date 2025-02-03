import { useEffect, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Column, Task } from "@/types";
import { TaskCard } from "@/components/global/TaskCard";
import { KanbanColumn } from "@/components/global/KanbanColumn";
import { db } from "@/config/firebaseConfig";
import { updateDoc, doc } from "firebase/firestore";

interface KanbanBoardProps {
  tasks: any;
  setTasks: React.Dispatch<
    React.SetStateAction<{
      todo: Task[];
      inprogress: Task[];
      completed: Task[];
      [key: string]: Task[];
    }>
  >;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, setTasks }) => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  const [columns, setColumns] = useState<Column[]>([
    {
      id: "todo",
      title: "TO-DO",
      bgColor: "bg-pink-100",
      items: tasks.todo || [],
    },
    {
      id: "inprogress",
      title: "IN-PROGRESS",
      bgColor: "bg-blue-100",
      items: tasks.inprogress || [],
    },
    {
      id: "completed",
      title: "COMPLETED",
      bgColor: "bg-green-100",
      items: tasks.completed || [],
    },
  ]);

  useEffect(() => {
    setColumns((prevColumns) =>
      prevColumns.map((column) => ({
        ...column,
        items: tasks[column.id as keyof typeof tasks] || [],
      }))
    );
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const findColumnByTaskId = (taskId: UniqueIdentifier): Column | undefined => {
    return columns.find((col) => col.items.some((item) => item.id === taskId));
  };

  const findColumnById = (columnId: UniqueIdentifier): Column | undefined => {
    return columns.find((col) => col.id === columnId);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const sourceColumn = findColumnByTaskId(active.id);
    const overColumn = findColumnById(over.id) || findColumnByTaskId(over.id);

    if (!sourceColumn || !overColumn) {
      setActiveId(null);
      return;
    }

    const activeItem = sourceColumn.items.find((item) => item.id === active.id);
    if (!activeItem) {
      setActiveId(null);
      return;
    }

    const newStatus =
      overColumn.id === "inprogress"
        ? "IN-PROGRESS"
        : overColumn.id === "completed"
        ? "COMPLETED"
        : "TO-DO";

    setTasks((prev) => {
      const cleanedPrev = {
        todo: prev.todo.filter((task) => task.id !== active.id),
        inprogress: prev.inprogress.filter((task) => task.id !== active.id),
        completed: prev.completed.filter((task) => task.id !== active.id),
      };

      return {
        ...cleanedPrev,
        [overColumn.id]: [
          ...cleanedPrev[overColumn.id as keyof typeof cleanedPrev],
          { ...activeItem, status: newStatus },
        ],
      };
    });

    // Update status in Firebase
    try {
      const taskRef = doc(db, "tasks", String(active.id));
      await updateDoc(taskRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating task status:", error);
    }

    setActiveId(null);
  };

  const activeItem =
    activeId &&
    columns.flatMap((col) => col.items).find((item) => item.id === activeId);

  return (
    <div className="w-full max-w-7xl p-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-6">
          {columns.map((column) => (
            <KanbanColumn key={column.id} column={column} tasks={column.items} />
          ))}
        </div>

        <DragOverlay>
          {activeItem && <TaskCard task={activeItem} setTasks={setTasks} isDragging />}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
