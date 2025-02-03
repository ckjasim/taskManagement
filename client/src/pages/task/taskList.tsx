import { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
} from 'lucide-react';
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
} from '@dnd-kit/sortable';
import { SortableTask } from '@/components/global/SortableTask';
import { addDoc, collection, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebaseConfig';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

interface TaskListProps {
  tasks: TasksByStatus;
  setTasks: React.Dispatch<React.SetStateAction<TasksByStatus>>;
}

interface NewTask {
  title: string;
  dueDate: string;
  status: string;
  category: string;
}

interface FormErrors {
  title?: string;
  dueDate?: string;
  status?: string;
  category?: string;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, setTasks }) => {
  const [showAddTask, setShowAddTask] = useState<boolean>(false);
  const [sections, setSections] = useState({
    todo: true,
    inprogress: true,
    completed: true,
  });
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<NewTask>({
    title: '',
    dueDate: '',
    status: 'TO-DO',
    category: 'WORK',
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});

  const onStatusChange = async (newStatus: string) => {
    try {
      const updatePromises = selectedTasks.map(async (task) => {
        const taskRef = doc(db, 'tasks', task.id);
        const timestamp = new Date().toISOString();
        const newActivity = {
          action: 'Status Updated',
          timestamp,
          performedBy: auth.currentUser?.uid || '',
        };

        await updateDoc(taskRef, {
          status: newStatus,
          activities: [...(task.activities || []), newActivity],
        });
      });

      await Promise.all(updatePromises);

      setTasks((prev) => {
        const newTasks = { ...prev };
        const statusKey = newStatus?.toLowerCase().replace('-', '');

        Object.keys(newTasks).forEach((key) => {
          if (newTasks[key]) {
            newTasks[key] = newTasks[key]?.filter(
              (task) => !selectedTasks.some((selected) => selected.id === task.id)
            );
          }
        });

        const updatedTasks = selectedTasks.map((task) => ({
          ...task,
          status: newStatus,
        }));

        newTasks[statusKey] = [...(newTasks[statusKey] || []), ...updatedTasks];

        return newTasks;
      });

      clearSelection();
    } catch (error) {
      console.error('Error updating task statuses:', error);
    }
  };

  const validateForm = (): boolean => {
    let newErrors: FormErrors = {};

    if (!newTask.title || newTask.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters long.";
    }

    if (!newTask.dueDate) {
      newErrors.dueDate = "Due date is required.";
    } else if (new Date(newTask.dueDate) < new Date()) {
      newErrors.dueDate = "Due date must be in the future.";
    }

    if (!newTask.status) {
      newErrors.status = "Please select a status.";
    }

    if (!newTask.category) {
      newErrors.category = "Please select a category.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMultipleDelete = async () => {
    try {
      const deletePromises = selectedTasks.map(async (task) => {
        const taskRef = doc(db, 'tasks', task.id);
        await deleteDoc(taskRef);
      });

      await Promise.all(deletePromises);

      setTasks((prev) => {
        const newTasks = { ...prev };
        Object.keys(newTasks).forEach((status) => {
          if (newTasks[status]) {
            newTasks[status] = newTasks[status]?.filter(
              (task) => !selectedTasks.some((selected) => selected.id === task.id)
            );
          }
        });
        return newTasks;
      });

      clearSelection();
    } catch (error) {
      console.error('Error deleting tasks:', error);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const toggleSection = (section: any) => {
    setSections((prev:any) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleTaskSelection = (task: Task) => {
    setSelectedTasks((prev) => {
      const isSelected = prev.some((t) => t.id === task.id);
      if (isSelected) {
        return prev.filter((t) => t.id !== task.id);
      } else {
        return [...prev, task];
      }
    });
  };

  const handleAddTask = async () => {
    if (validateForm()) {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        console.error('No user logged in');
        return;
      }
      const statusKey = newTask.status.toLowerCase().replace('-', '');

      try {
        const timestamp = new Date().toISOString();
        const newActivity = {
          action: 'Task Created',
          timestamp,
          performedBy: currentUser.uid,
        };

        const docRef = await addDoc(collection(db, 'tasks'), {
          ...newTask,
          userId: currentUser.uid,
          activities: [newActivity],
        });

        const taskToAdd: Task = {
          id: docRef.id,
          ...newTask,
        };

        setTasks((prev) => ({
          ...prev,
          [statusKey]: [...(prev[statusKey] || []), taskToAdd],
        }));

        setNewTask({
          title: '',
          dueDate: '',
          status: 'TO-DO',
          category: 'WORK',
        });
        setShowAddTask(false);
      } catch (error) {
        console.error('Error adding task:', error);
      }
    }
  };

  const clearSelection = () => {
    setSelectedTasks([]);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    const newStatus =
      over.id === 'inprogress'
        ? 'IN-PROGRESS'
        : over.id === 'completed'
        ? 'COMPLETED'
        : 'TO-DO';

    setTasks((prev) => {
      const newTasks = { ...prev };

      // Find the task and its current status
      let activeTask = null;
      let sourceStatus = null;

      for (const [status, statusTasks] of Object.entries(prev)) {
        const task = statusTasks?.find((t) => t.id === active.id);
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
        const task = statusTasks?.find((t) => t.id === over.id);
        if (task) {
          overTask = task;
          destStatus = status;
          break;
        }
      }

      if (!overTask || !destStatus) return prev;

      // Remove from source
      newTasks[sourceStatus] = newTasks[sourceStatus]?.filter(
        (task) => task.id !== active.id
      );

      // Insert at new position
      const overIndex = newTasks[destStatus]?.findIndex(
        (task) => task.id === over.id
      );

      newTasks[destStatus] = [
        ...((newTasks[destStatus] ?? []) as Task[]), 
        ...newTasks[destStatus]?.slice(0, overIndex) ?? [],
        { ...activeTask, status: destStatus.toUpperCase() },
        ...newTasks[destStatus]?.slice(overIndex) ?? [],
      ];
      
      return newTasks;
    });

    try {
      const taskRef = doc(db, 'tasks', String(active.id));
      await updateDoc(taskRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
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
                <span className="font-medium">
                  Todo ({tasks.todo?.length || 0})
                </span>
                {sections.todo ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>

              {sections.todo && (
                <>
                 {showAddTask ? (
  <div className="p-3 px-10 bg-gray-50 border-b border-gray-200">
    <div className="flex gap-4 mb-2">
      <input
        type="text"
        value={newTask.title}
        onChange={(e) =>
          setNewTask((prev) => ({
            ...prev,
            title: e.target.value,
          }))
        }
        placeholder="Task Title"
        className="flex-1 p-2 bg-transparent outline-none text-sm border rounded-md"
      />
      {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}

      <div className="relative">
        <input
          type="date"
          value={newTask.dueDate}
          onChange={(e) =>
            setNewTask((prev) => ({
              ...prev,
              dueDate: e.target.value,
            }))
          }
          className={`w-32 p-2 border rounded-2xl text-sm bg-white cursor-pointer ${
            !newTask.dueDate && 'text-gray-400'
          }`}
          style={{ colorScheme: 'none' }}
          onFocus={(e) => e.target.showPicker()}
        />
        {errors.dueDate && <p className="text-red-500 text-xs">{errors.dueDate}</p>}
      </div>

      <Select
        value={newTask.status}
        onValueChange={(value) =>
          setNewTask((prev) => ({ ...prev, status: value }))
        }
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TO-DO">TO-DO</SelectItem>
          <SelectItem value="IN-PROGRESS">IN-PROGRESS</SelectItem>
          <SelectItem value="COMPLETED">COMPLETED</SelectItem>
        </SelectContent>
      </Select>
      {errors.status && <p className="text-red-500 text-xs">{errors.status}</p>}

      <Select
        value={newTask.category}
        onValueChange={(value) =>
          setNewTask((prev) => ({ ...prev, category: value }))
        }
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="WORK">WORK</SelectItem>
          <SelectItem value="PERSONAL">PERSONAL</SelectItem>
        </SelectContent>
      </Select>
      {errors.category && <p className="text-red-500 text-xs">{errors.category}</p>}
    </div>

    <div className="flex gap-2">
      <button
        onClick={handleAddTask}
        className="px-6 bg-purple-600 text-white rounded-2xl text-sm font-medium hover:bg-purple-700"
      >
        ADD
      </button>
      <button
        onClick={() => setShowAddTask(false)}
        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
      >
        CANCEL
      </button>
    </div>
  </div>
) : (
  <div
    className="p-3 flex items-center gap-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
    onClick={() => setShowAddTask(true)}
  >
    <Plus className="w-4 h-4 text-gray-400" />
    <div className="flex-1 text-gray-500 text-sm">Add Task</div>
  </div>
)}


                  <SortableContext
                    items={tasks.todo?.map((t) => t.id) || []}
                    strategy={verticalListSortingStrategy}
                  >
                    {tasks.todo && tasks.todo.length > 0 ? (
                      tasks.todo.map((task) => (
                        <SortableTask
                          key={task.id}
                          task={task}
                          setTasks={setTasks}
                          selected={selectedTasks.some((t) => t.id === task.id)}
                          onSelect={toggleTaskSelection}
                        />
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-48">
                        <h1 className="text-sm ">No Tasks in To-Do</h1>
                      </div>
                    )}
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
                <span className="font-medium">
                  In-Progress ({tasks.inprogress?.length || 0})
                </span>
                {sections.inprogress ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
              {sections.inprogress && (
                <SortableContext
                  items={tasks.inprogress?.map((t) => t.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  {tasks.inprogress && tasks.inprogress.length > 0 ? (
                    tasks.inprogress?.map((task) => (
                      <SortableTask
                        key={task.id}
                        task={task}
                        setTasks={setTasks}
                        selected={selectedTasks.some((t) => t.id === task.id)}
                        onSelect={toggleTaskSelection}
                      />
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-48">
                      <h1 className="text-sm ">No Tasks in IN-Progress</h1>
                    </div>
                  )}
                </SortableContext>
              )}
            </div>

            {/* Completed Section */}
            <div>
              <div
                className="bg-green-100 p-3 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection('completed')}
              >
                <span className="font-medium">
                  Completed ({tasks.completed?.length || 0})
                </span>
                {sections.completed ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
              {sections.completed && (
                <SortableContext
                  items={tasks.completed?.map((t) => t.id) || []}
                  strategy={verticalListSortingStrategy}
                >
                  {tasks.completed && tasks.completed.length > 0 ? (
                    tasks.completed?.map((task) => (
                      <SortableTask
                        key={task.id}
                        task={task}
                        setTasks={setTasks}
                        selected={selectedTasks.some((t) => t.id === task.id)}
                        onSelect={toggleTaskSelection}
                      />
                    ))
                  ) : (
                    <div className="flex items-center justify-center h-48">
                      <h1 className="text-sm ">No Tasks in Completed</h1>
                    </div>
                  )}
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
                {tasks.todo?.find((t) => t.id === activeId)?.title ||
                  tasks.inprogress?.find((t) => t.id === activeId)?.title ||
                  tasks.completed?.find((t) => t.id === activeId)?.title}
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Selection Action Bar */}
      {selectedTasks.length > 0 && (
        <div className="w-max md:w-fit fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-5 py-2 rounded-xl flex items-center gap-3 shadow-lg border border-gray-700">
          <button
            onClick={clearSelection}
            className="flex items-center gap-2 bg-gray-800 px-2 py-1 rounded-full text-sm"
          >
            <span>{selectedTasks.length} Tasks Selected</span>
            <X className="w-4 h-4" />
          </button>

          <Select onValueChange={onStatusChange}>
            <SelectTrigger className="bg-gray-800 text-white border-gray-800 rounded-2xl text-xs w-24 h-7 focus:ring-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-700">
              <SelectItem value="TO-DO" className="focus:bg-gray-700">
                TO-DO
              </SelectItem>
              <SelectItem value="IN-PROGRESS" className="focus:bg-gray-700">
                IN-PROGRESS
              </SelectItem>
              <SelectItem value="COMPLETED" className="focus:bg-gray-700">
                COMPLETED
              </SelectItem>
            </SelectContent>
          </Select>

          <button 
            onClick={handleMultipleDelete}
            className="text-red-500 bg-gray-800 px-2 py-1 rounded-full text-sm hover:bg-gray-700"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default TaskList;
