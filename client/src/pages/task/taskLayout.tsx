import {
  List,
  LayoutGrid,
  Search,
  ChevronDown,
  UserCircle,
  ClipboardList,
  LogOut,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import CreateTaskModal from '@/components/global/modal/TaskModal';
import TaskList from './taskList';
import KanbanBoard from './taskBoard';
import { db } from '@/config/firebaseConfig';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth } from '@/config/firebaseConfig';
import { useAuth } from '@/context/AuthProvider';
import TaskModal from '@/components/global/modal/TaskModal';
const TaskLayout = () => {
  const [activeView, setActiveView] = useState('list');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tasks, setTasks] = useState({});
  const { user } = useAuth();

  const fetchTasks = async () => {
    if (!user) {
      console.error('No user logged in');
      return;
    }

    try {
      // Query tasks where `userId` matches the logged-in user
      const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const allTasks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Normalize status keys
      const newTasks: Record<string, any[]> = {};
      allTasks.forEach((task) => {
        const statusKey = task.status.toLowerCase().replace('-', '');
        if (!newTasks[statusKey]) {
          newTasks[statusKey] = [];
        }
        newTasks[statusKey].push(task);
      });
      console.log(newTasks, 'sssssssssssssssssssss');
      setTasks(newTasks);
    } catch (error) {
      console.error('Error fetching tasks from Firestore:', error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async (taskData: any) => {
    console.log('ddddddddddddd');
    const user = auth.currentUser; // Get the currently logged-in user

    if (!user) {
      console.error('No user logged in');
      return;
    }

    try {
      // Add task to Firestore with userId
      const docRef = await addDoc(collection(db, 'tasks'), {
        ...taskData,
        userId: user.uid, // Associate task with logged-in user
      });

      // Normalize status key (remove hyphens & special chars)
      const statusKey = taskData.status.toLowerCase().replace('-', '');

      // Update state with Firebase-generated ID
      const newTask = { id: docRef.id, ...taskData, userId: user.uid };

      console.log('Task added to Firestore:', newTask);

      // Update local state safely
      setTasks((prev) => ({
        ...prev,
        [statusKey]: [newTask, ...(prev[statusKey] || [])], // Ensure array exists
      }));
    } catch (error) {
      console.error('Error adding task to Firestore:', error);
    }
  };

  return (
    <>
      <TaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleAddTask}
      />
      <div className="relative  w-full px-10 py-14 ">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className=" rounded">
              <ClipboardList className="text-xl font-bold" />
            </div>
            <h1 className="text-xl font-semibold">TaskBuddy</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                className="w-8 h-8 rounded-full"
                src={user?.photoURL}
                alt=""
              />
            </div>
            <button className="text-gray-600 text-sm font-sem font-semibold">
              {user?.displayName}
            </button>
          </div>       
        </div>

        {/* View Toggle and Filters */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-4">
            <button
              onClick={() => {
                setActiveView('list');
              }}
              className={`flex items-center gap-2 font-medium ${
                activeView === 'list'
                  ? 'text-black font-bold border-black border-b-2'
                  : 'text-gray-600'
              }`}
            >
              <List className="w-4 h-4" /> List
            </button>

            <button
              onClick={() => {
                setActiveView('board');
              }}
              className={`flex items-center gap-2 font-medium ${
                activeView === 'board'
                  ? 'text-black font-bold border-black border-b-2'
                  : 'text-gray-600'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Board
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-xl px-2 py-2 border border-gray-200">
            <button className="text-gray-600 text-sm font-semibold">
              Logout
            </button>
            <LogOut className="w-4 h-4 text-sm" />
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
      <div className="gap-4">
        <div className="flex gap-4 items-center">
          <span className="text-sm font-medium">Filter by:</span>
          <div className="relative">
            <select className="appearance-none px-2 py-1 pr-8 border rounded-2xl bg-white text-sm">
              <option>Category</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <div className="relative">
            <select className="appearance-none px-2 py-1  pr-8 border rounded-2xl bg-white text-sm">
              <option>Due Date</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>
      <div className="flex gap-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="pl-10 pr-4 py-2 border rounded-3xl text-sm"
          />
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-8 py-2 bg-[#7b1984e2] text-white rounded-3xl text-xs font-medium hover:bg-[#7b1984fe] transition-colors"
        >
          ADD TASK
        </button>
      </div>
    </div>
        {activeView === 'list' ? (
          <TaskList tasks={tasks} setTasks={setTasks} />
        ) : (
          <KanbanBoard tasks={tasks} setTasks={setTasks} />
        )}
      </div>
    </>
  );
};

export default TaskLayout;
