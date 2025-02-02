import { useEffect, useState } from 'react';
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
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Column } from '@/types';
import { TaskCard } from '@/components/global/TaskCard';
import { KanbanColumn } from '@/components/global/KanbanColumn';
import { db } from '@/config/firebaseConfig';
import { updateDoc, doc } from 'firebase/firestore';

const KanbanBoard = ({ tasks, setTasks }) => {
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  
  const [columns, setColumns] = useState<Column[]>([
    {
      id: 'todo',
      title: 'TO-DO',
      bgColor: 'bg-pink-100',
      items: tasks.todo || []
    },
    {
      id: 'inprogress',
      title: 'IN-PROGRESS',
      bgColor: 'bg-blue-100',
      items: tasks.inprogress || []
    },
    {
      id: 'completed',
      title: 'COMPLETED',
      bgColor: 'bg-green-100',
      items: tasks.completed || []
    }
  ]);

  useEffect(() => {
    setColumns(prevColumns => prevColumns.map(column => ({
      ...column,
      items: tasks[column.id.toLowerCase().replace('-', '')] || []
    })));
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
  
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }
  
    // Find the source and destination columns
    const activeContainer = columns.find(col =>
      col.items.some(item => item.id === active.id)
    );
    const overContainer = columns.find(col =>
      col.id === over.id || col.items.some(item => item.id === over.id)
    );

    console.log(activeContainer,'ssssssssss')
    console.log(overContainer,'fff')
  
    if (!activeContainer || !overContainer) {
      setActiveId(null);
      return;
    }
  
    const activeItem = activeContainer.items.find(item => item.id === active.id);
    if (!activeItem) {
      setActiveId(null);
      return;
    }

    const newStatus =
      overContainer.id === "inprogress"
        ? "IN-PROGRESS"
        : overContainer.id === "completed"
        ? "COMPLETED"
        : "TO-DO";

    setTasks(prev => {
      // First, remove the task from all columns to prevent duplicates
      const cleanedPrev = Object.entries(prev).reduce((acc, [key, value]) => {
        acc[key] = value.filter(task => task.id !== active.id);
        return acc;
      }, {});
      
      // Then add the task to the destination column
      return {
        ...cleanedPrev,
        [overContainer.id]: [
          ...cleanedPrev[overContainer.id],
          { ...activeItem, status: newStatus }
        ]
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

  const activeItem = activeId ? columns
    .flatMap(col => col.items)
    .find(item => item.id === activeId) : null;

  return (
    <div className="w-full max-w-7xl p-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-3 gap-6">
          {columns.map(column => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={column.items}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem && (
            <TaskCard 
              task={activeItem}
              isDragging={true}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;