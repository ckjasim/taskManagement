import React, { useState } from "react";
import { MoreHorizontal } from "lucide-react";

interface TaskActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

const TaskActions: React.FC<TaskActionsProps> = ({ onEdit, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <div className="relative">
      <button 
        onClick={toggleMenu} 
        className="p-1 hover:bg-gray-100 rounded"
      >
        <MoreHorizontal className="w-5 h-5 text-gray-600" />
      </button>

      {/* Dropdown menu */}
      {isMenuOpen && (
        <div 
          className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-300 shadow-lg rounded-md z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            onClick={(e) => {
              e.stopPropagation(); // Prevent closing on drag
              onEdit();
              setIsMenuOpen(false);
            }} 
            className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
          >
            Edit
          </div>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              setIsMenuOpen(false);
            }} 
            className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 text-red-500"
          >
            Delete
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskActions;