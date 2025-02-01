
import { List, LayoutGrid,  Search, ChevronDown,  UserCircle,  } from 'lucide-react';
import { useEffect, useState } from 'react';
import CreateTaskModal from '@/components/global/modal/TaskModal';
import TaskList from './taskList';
import KanbanBoard from './taskBoard';
import { db } from '@/config/firebaseConfig';
import { addDoc, collection, getDocs, query, where  } from 'firebase/firestore';
import { auth } from '@/config/firebaseConfig'
import { useAuth } from '@/context/AuthProvider';
import TaskModal from '@/components/global/modal/TaskModal';
const TaskLayout = () => {
  const [activeView, setActiveView] = useState("list");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
   const [tasks, setTasks] = useState({    });
   const { user } = useAuth();

      
   const fetchTasks = async () => {
    
    if (!user) {
      console.error("No user logged in");
      return;
    }
  
    try {
      // Query tasks where `userId` matches the logged-in user
      const q = query(collection(db, "tasks"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
  
      const allTasks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Normalize status keys
      const newTasks: Record<string, any[]> = {};
      allTasks.forEach((task) => {
        const statusKey = task.status.toLowerCase().replace("-", "");
        if (!newTasks[statusKey]) {
          newTasks[statusKey] = [];
        }
        newTasks[statusKey].push(task);
      });
      console.log(newTasks,'sssssssssssssssssssss')
      setTasks(newTasks);
    } catch (error) {
      console.error("Error fetching tasks from Firestore:", error);
    }
  };
  
    useEffect(()=>{
     fetchTasks()
    
    },[])
    
    const handleAddTask = async (taskData: any) => {
      console.log('ddddddddddddd')
      const user = auth.currentUser; // Get the currently logged-in user

      if (!user) {
        console.error("No user logged in");
        return;
      }
    
      try {
        // Add task to Firestore with userId
        const docRef = await addDoc(collection(db, "tasks"), {
          ...taskData,
          userId: user.uid, // Associate task with logged-in user
        });
    
        // Normalize status key (remove hyphens & special chars)
        const statusKey =taskData.status.toLowerCase().replace("-", "");
    
        // Update state with Firebase-generated ID
        const newTask = { id: docRef.id, ...taskData, userId: user.uid };
    
        console.log("Task added to Firestore:", newTask);
    
        // Update local state safely
        setTasks((prev) => ({
          ...prev,
          [statusKey]: [newTask, ...(prev[statusKey] || [])], // Ensure array exists
        }));
      } catch (error) {
        console.error("Error adding task to Firestore:", error);
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
    <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 rounded">
            <List className="w-6 h-6 text-purple-600" />
          </div>
          <h1 className="text-xl font-semibold">TaskBuddy</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <UserCircle className="w-8 h-8 text-purple-600" />
          </div>
          <button className="text-gray-600">Logout</button>
        </div>
      </div>

      {/* View Toggle and Filters */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <div className="flex gap-4">
          <button
        onClick={() => {
          setActiveView("list");
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium ${
          activeView === "list" ? "bg-gray-200 text-black" : "text-gray-600"
        }`}
      >
        <List className="w-4 h-4" /> List
      </button>
      
      <button
        onClick={() => {
          setActiveView("board");
        }}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium ${
          activeView === "board" ? "bg-gray-200 text-black" : "text-gray-600"
        }`}
      >
        <LayoutGrid className="w-4 h-4" /> Board
      </button>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <select className="appearance-none px-4 py-2 pr-8 border rounded-md bg-white">
                <option>Category</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
            <div className="relative">
              <select className="appearance-none px-4 py-2 pr-8 border rounded-md bg-white">
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
              className="pl-10 pr-4 py-2 border rounded-md"
            />
          </div>
          <button onClick={()=>{setIsCreateModalOpen(true)}} className="px-4 py-2 bg-purple-600 text-white rounded-md">
            ADD TASK
          </button>
        </div>
      </div>
      {  activeView === "list" ? <TaskList tasks={tasks} setTasks={setTasks}/> : <KanbanBoard tasks={tasks} setTasks={setTasks}/>}
    </div>
    </>
  );
};

export default TaskLayout;
