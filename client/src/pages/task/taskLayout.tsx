import {
  List,
  LayoutGrid,
  Search,
  ChevronDown,
  ClipboardList,
  LogOut,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import TaskList from './taskList';
import KanbanBoard from './taskBoard';
import { db } from '@/config/firebaseConfig';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { auth } from '@/config/firebaseConfig';
import { useAuth } from '@/context/AuthProvider';
import TaskModal from '@/components/global/modal/TaskModal';
import { Tasks, TasksByStatus } from '@/types';

const TaskLayout = () => {
  const [activeView, setActiveView] = useState<'list' | 'board'>('list');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [tasks, setTasks] = useState<TasksByStatus>({});
  const [filteredTasks, setFilteredTasks] = useState<TasksByStatus>({});
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user } = useAuth();

  const fetchTasks = async () => {
    if (!user) {
      console.error('No user logged in');
      return;
    }

    try {
      const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const allTasks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Tasks[];

      const newTasks: TasksByStatus = {};
      allTasks.forEach((task) => {
        const statusKey = task.status.toLowerCase().replace('-', '');
        if (!newTasks[statusKey]) {
          newTasks[statusKey] = [];
        }
        newTasks[statusKey].push(task);
      });
      
      setTasks(newTasks);
      applyFilters(newTasks, categoryFilter, dueDateFilter, searchQuery);
    } catch (error) {
      console.error('Error fetching tasks from Firestore:', error);
    }
  };

  const applyFilters = (
    taskData: TasksByStatus,
    category: string,
    dueDate: string,
    search: string
  ) => {
    const filtered: TasksByStatus = {};
    
    Object.keys(taskData).forEach((status) => {
      filtered[status] = taskData[status].filter((task) => {
        const searchMatch = search === '' || 
          task.title.toLowerCase().includes(search.toLowerCase()) ||
          task.description.toLowerCase().includes(search.toLowerCase());
        
        const categoryMatch = category === 'all' || task.category === category;
        let dateMatch = true;

        if (dueDate !== 'all') {
          const taskDate = new Date(task.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
        
          switch (dueDate) {
            case 'today':
              dateMatch = taskDate.toDateString() === today.toDateString();
              break;
        
            case 'week':
              const weekFromNow = new Date(today);
              weekFromNow.setDate(today.getDate() + 7);
              dateMatch = taskDate >= today && taskDate <= weekFromNow;
              break;
        
            case 'month':
              const monthFromNow = new Date(today);
              monthFromNow.setMonth(today.getMonth() + 1);
              dateMatch = taskDate >= today && taskDate <= monthFromNow;
              break;
          }
        }

        return categoryMatch && dateMatch && searchMatch;
      });
    });

    setFilteredTasks(filtered);
  };

  useEffect(() => {
    fetchTasks();
  }, [user]); 

  useEffect(() => {
    applyFilters(tasks, categoryFilter, dueDateFilter, searchQuery);
  }, [categoryFilter, dueDateFilter, searchQuery, tasks]);

  const handleAddTask = async (taskData: Omit<Tasks, 'id' | 'userId'>) => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error('No user logged in');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'tasks'), {
        ...taskData,
        userId: currentUser.uid,
      });

      const statusKey = taskData.status.toLowerCase().replace('-', '');
      const newTask = { id: docRef.id, ...taskData, userId: currentUser.uid };

      const updatedTasks = {
        ...tasks,
        [statusKey]: [newTask, ...(tasks[statusKey] || [])],
      };

      setTasks(updatedTasks);
      applyFilters(updatedTasks, categoryFilter, dueDateFilter, searchQuery);
      setIsCreateModalOpen(false);
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
      <div className="relative w-full px-10 py-14">

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="rounded">
              <ClipboardList className="text-xl font-bold" />
            </div>
            <h1 className="text-xl font-semibold">TaskBuddy</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                className="w-8 h-8 rounded-full"
                src={user?.photoURL || ''}
                alt="User avatar"
              />
            </div>
            <button className="text-gray-600 text-sm font-semibold">
              {user?.displayName}
            </button>
          </div>       
        </div>

        {/* View toggle section remains the same */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveView('list')}
              className={`flex items-center gap-2 font-medium ${
                activeView === 'list'
                  ? 'text-black font-bold border-black border-b-2'
                  : 'text-gray-600'
              }`}
            >
              <List className="w-4 h-4" /> List
            </button>

            <button
              onClick={() => setActiveView('board')}
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

        {/* Filters and search section */}
        <div className="flex justify-between items-center mb-6">
          <div className="gap-4">
            <div className="flex gap-4 items-center">
              <span className="text-sm font-medium">Filter by:</span>
              <div className="relative">
                <select 
                  className="appearance-none px-2 py-1 pr-8 border rounded-2xl bg-white text-sm"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <div className="relative">
                <select 
                  className="appearance-none px-2 py-1 pr-8 border rounded-2xl bg-white text-sm"
                  value={dueDateFilter}
                  onChange={(e) => setDueDateFilter(e.target.value)}
                >
                  <option value="all">All Due Dates</option>
                  <option value="today">Due Today</option>
                  <option value="week">Due This Week</option>
                  <option value="month">Due This Month</option>
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* Task views */}
        {activeView === 'list' ? (
          <TaskList tasks={filteredTasks} setTasks={setTasks} />
        ) : (
          <KanbanBoard tasks={filteredTasks} setTasks={setTasks} />
        )}
      </div>
    </>
  );
};

export default TaskLayout;