import { useState } from "react";
import { MoreHorizontal } from "lucide-react"; // Assuming you already imported this icon

const TaskActions = ({ onEdit, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="relative">
      <button onClick={toggleMenu} className="p-1">
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Dropdown menu */}
      {isMenuOpen && (
        <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-300 shadow-lg rounded-md z-10">
          <div 
            onClick={() => {
              onEdit();  // Trigger edit action
              setIsMenuOpen(false); // Close menu
            }} 
            className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-200"
          >
            Edit
          </div>
          <div 
            onClick={() => {
              onDelete();  // Trigger delete action
              setIsMenuOpen(false); // Close menu
            }} 
            className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-200"
          >
            Delete
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskActions;
