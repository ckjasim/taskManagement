import { useState } from 'react';
import { Calendar, ChevronDown, MoreVertical, ChevronUp, Plus, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { SortableTask } from '@/components/global/SortableTask';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';



const TaskList = ({tasks, setTasks}) => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [sections, setSections] = useState({
    todo: true,
    inprogress: true, 
    completed: true
  });
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    dueDate: '',
    status: 'TO-DO',
    category: 'WORK'
  });
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const toggleSection = (section) => {
    setSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleTaskSelection = (task) => {
    setSelectedTasks(prev => {
      const isSelected = prev.some(t => t.id === task.id);
      if (isSelected) {
        return prev.filter(t => t.id !== task.id);
      } else {
        return [...prev, task];
      }
    });
  };

  const handleAddTask = () => {
    const newId = Math.max(...Object.values(tasks).flatMap(t => t.map(task => task.id)), 0) + 1;
    const taskToAdd = {
      id: newId,
      ...newTask
    };

    setTasks(prev => ({
      ...prev,
      todo: [...(prev.todo || []), taskToAdd]
    }));

    setNewTask({
      title: '',
      dueDate: '',
      status: 'TO-DO',
      category: 'WORK'
    });
    setShowAddTask(false);
  };

  const clearSelection = () => {
    setSelectedTasks([]);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }
    const newStatus =
    over.id === "inprogress"
        ? "IN-PROGRESS"
        : over.id === "completed"
        ? "COMPLETED"
        : "TO-DO";
        
    setTasks(prev => {
      const newTasks = { ...prev };
      
      // Find the task and its current status
      let activeTask = null;
      let sourceStatus = null;
      
      for (const [status, statusTasks] of Object.entries(prev)) {
        const task = statusTasks?.find(t => t.id === active.id);
        if (task) {
          activeTask = task;
          sourceStatus = status;
          break;
        }
      }

      if (!activeTask || !sourceStatus) return prev;

      // Find the destination task and its status
      let overTask = null;
      let destStatus = null;
      
      for (const [status, statusTasks] of Object.entries(prev)) {
        const task = statusTasks?.find(t => t.id === over.id);
        if (task) {
          overTask = task;
          destStatus = status;
          break;
        }
      }

      if (!overTask || !destStatus) return prev;

      // Remove from source
      newTasks[sourceStatus] = newTasks[sourceStatus].filter(
        task => task.id !== active.id
      );

      // Insert at new position
      const overIndex = newTasks[destStatus].findIndex(
        task => task.id === over.id
      );
      
      newTasks[destStatus] = [
        ...newTasks[destStatus].slice(0, overIndex),
        { ...activeTask, status: destStatus.toUpperCase() },
        ...newTasks[destStatus].slice(overIndex)
      ];

      return newTasks;
    });

    try {
      const taskRef = doc(db, "tasks", String(active.id));
      await updateDoc(taskRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating task status:", error);
    }

    setActiveId(null);
  };

  return (
    <div className="w-full p-4 relative">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Card>
          <CardContent className="p-0">
            {/* Todo Section */}
            <div className="border-b">
              <div 
                className="bg-pink-100 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('todo')}
              >
                <span className="font-medium">Todo ({tasks.todo?.length || 0})</span>
                {sections.todo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
              
              {sections.todo && (
                <>
                  {showAddTask && (
                    <div className="p-3 px-10 bg-gray-50">
                      <div className="flex gap-4 mb-2">
                        <input 
                          type="text"
                          value={newTask.title}
                          onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="Task Title"
                          className="flex-1 p-2 bg-gray-50"
                        />
                        <input 
                          type="date"
                          value={newTask.dueDate}
                          onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-32 p-2 bg-gray-50"
                        />
                        <select 
                          value={newTask.status}
                          onChange={(e) => setNewTask(prev => ({ ...prev, status: e.target.value }))}
                          className="w-32 p-2 border rounded-md"
                        >
                          <option>TO-DO</option>
                          <option>IN-PROGRESS</option>
                          <option>COMPLETED</option>
                        </select>
                        <select 
                          value={newTask.category}
                          onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                          className="w-32 p-2 border rounded-md"
                        >
                          <option>WORK</option>
                          <option>PERSONAL</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="px-4 py-2 bg-purple-600 text-white rounded-md"
                          onClick={handleAddTask}
                        >
                          ADD
                        </button>
                        <button 
                          className="px-4 py-2"
                          onClick={() => setShowAddTask(false)}
                        >
                          CANCEL
                        </button>
                      </div>
                    </div>
                  )}

                  {!showAddTask && (
                    <div 
                      className="p-3 border-b flex items-center gap-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                      onClick={() => setShowAddTask(true)}
                    >
                      <Plus className="w-4 h-4 text-gray-400" />
                      <div className="flex-1 text-gray-500">Add Task</div>
                    </div>
                  )}

                  <SortableContext items={tasks.todo?.map(t => t.id) || []} strategy={verticalListSortingStrategy}>
                    {tasks.todo?.map(task => (
                      <SortableTask
                        key={task.id}
                        task={task}

                        setTasks={setTasks}
                        selected={selectedTasks.some(t => t.id === task.id)}
                        onSelect={toggleTaskSelection}
                      />
                    ))}
                  </SortableContext>
                </>
              )}
            </div>

            {/* In Progress Section */}
            <div className="border-b">
              <div 
                className="bg-blue-100 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('inprogress')}
              >
                <span className="font-medium">In-Progress ({tasks.inprogress?.length || 0})</span>
                {sections.inprogress ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
              {sections.inprogress && (
                <SortableContext items={tasks.inprogress?.map(t => t.id) || []} strategy={verticalListSortingStrategy}>
                  {tasks.inprogress?.map(task => (
                    <SortableTask
                      key={task.id}
                      task={task}
                      setTasks={setTasks}

                      selected={selectedTasks.some(t => t.id === task.id)}
                      onSelect={toggleTaskSelection}
                    />
                  ))}
                </SortableContext>
              )}
            </div>

            {/* Completed Section */}
            <div>
              <div 
                className="bg-green-100 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('completed')}
              >
                <span className="font-medium">Completed ({tasks.completed?.length || 0})</span>
                {sections.completed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
              {sections.completed && (
                <SortableContext items={tasks.completed?.map(t => t.id) || []} strategy={verticalListSortingStrategy}>
                  {tasks.completed?.map(task => (
                    <SortableTask
                      key={task.id}
                      task={task}
                      setTasks={setTasks}

                      selected={selectedTasks.some(t => t.id === task.id)}
                      onSelect={toggleTaskSelection}
                    />
                  ))}
                </SortableContext>
              )}
            </div>
          </CardContent>
        </Card>

        <DragOverlay>
          {activeId && (
            <div className="p-3 border-b flex items-center gap-3 bg-white shadow-lg rounded-md">
              <Calendar className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                {tasks.todo?.find(t => t.id === activeId)?.title || 
                 tasks.inprogress?.find(t => t.id === activeId)?.title || 
                 tasks.completed?.find(t => t.id === activeId)?.title}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Selection Action Bar */}
      {selectedTasks.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-4 rounded-full flex items-center gap-3 shadow-lg border border-gray-700">
          <button onClick={clearSelection} className="flex items-center gap-2 bg-gray-800 px-2 py-1 rounded-full text-sm">
            <span>{selectedTasks.length} Tasks Selected</span>
            <X className="w-4 h-4" />
          </button>
          <select className="bg-gray-800 text-white px-2 py-1 rounded-md border border-gray-600 text-sm">
            <option>Status</option>
            <option>TO-DO</option>
            <option>IN-PROGRESS</option>
            <option>COMPLETED</option>
          </select>
          <button className="text-red-500 bg-gray-800 px-2 py-1 rounded-full text-sm">Delete</button>
        </div>
      )}
    </div>
  );
};

export default TaskList;