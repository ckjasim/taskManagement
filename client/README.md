Task Management App (React + TypeScript + Firebase)
This is a task management application built using React, TypeScript, and Firebase. It allows users to authenticate with Google, manage their profiles, and perform various task management operations.

Features
1. User Authentication:
Google Sign-In: Users can authenticate using their Google account via Firebase Authentication.
Profile Management: Users can view and update their profiles.
2. Task Management:
Create, Edit, and Delete Tasks: Users can manage tasks within the application.
Task Categorization: Tasks can be categorized (e.g., work, personal).
Tagging: Tasks can be tagged for better organization.
Due Dates: Users can set due dates for tasks.
Drag-and-Drop: Tasks can be rearranged via drag-and-drop functionality.
Sorting: Tasks can be sorted based on due dates in ascending or descending order.
3. Batch Actions:
Users can perform batch actions on tasks, such as deleting multiple tasks or marking multiple tasks as complete.
4. Task History and Activity Log:
Track changes made to tasks (e.g., creation, edits, deletions) and view an activity log for each task.
5. Filter Options:
Tasks can be filtered by tags, category, and date range.
Search functionality allows users to search for tasks by title.
6. Board/List View:
Users can toggle between a Kanban-style board view and a list view for task management.
7. Responsive Design:
The app is fully responsive, adapting to various screen sizes (mobile, tablet, desktop) with a mobile-first design approach.
Technical Stack
React with TypeScript for building the user interface.
Firebase for user authentication and data storage.
Vite as the development build tool for fast bundling.
Installation
Prerequisites
Node.js (v14 or higher)
Firebase project setup (for Authentication and Firestore)
Steps to Run the Project
Clone the Repository

bash
Copy
Edit
git clone https://github.com/ckjasim/taskManagement.git
cd client
Install Dependencies

bash
Copy
Edit
npm install
Configure Firebase

Create a Firebase project in the Firebase Console.
Set up Firebase Authentication (Google Sign-In).
Set up Firestore for task data storage.
Copy the Firebase config into a .env file at the root of the project.


bash
Copy
Edit
npm run dev

Open the app in your browser by visiting https://task-management-six-smoky.vercel.app/

Features Overview
User Authentication
Users can sign in using Google via Firebase Authentication.
Once signed in, users can manage their profiles and log out at any time.
Task Management
Create: Users can add new tasks with titles, descriptions, tags, due dates, and file attachments.
Edit: Users can update task details, including changing tags, due dates, and adding new files.
Delete: Users can delete tasks they no longer need.
Drag-and-Drop: Rearrange tasks within a list by dragging and dropping.
Task History and Activity Log
Every action (create, update, delete) on tasks is logged and viewable by the user.
Task Filters and Search
Tasks can be filtered by tags, category, and date range.
Users can search for tasks based on the task title.
Board and List Views
Users can toggle between a Kanban-style board view and a list view for managing their tasks.
File Attachments
Users can upload files during task creation/editing and view them within the task details.
Responsive Design
The app adapts seamlessly to all screen sizes, ensuring a smooth experience on mobile, tablet, and desktop.
Technical Details
Firebase Integration
The app uses Firebase for user authentication and Firestore for task storage. Firebase Authentication with Google Sign-In is used for authentication, and Firestore is used to manage task data.


Drag-and-Drop
The task list supports drag-and-drop functionality using the React DnD library.

Sorting and Filtering
Tasks can be sorted by due date, and users can filter tasks by tags, categories, or date range. The filtering is handled efficiently with React Query and Firestore queries.


Conclusion
This task management app offers a complete solution for task organization with advanced features like Google authentication, task categorization  and drag-and-drop functionality, all powered by React, TypeScript, and Firebase.

