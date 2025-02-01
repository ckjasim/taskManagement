import { createBrowserRouter } from 'react-router-dom';
import AuthLayout from '../pages/auth/authLayout';
import LoginPage from '../pages/auth/loginPage';
import TaskLayout from '../pages/task/taskLayout';



const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      { path: '', element: <LoginPage/> },
    ],
  },
  {
    path: '/task',
    element: <TaskLayout />,
  },


]);

export default router;
