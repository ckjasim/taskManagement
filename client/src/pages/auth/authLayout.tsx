
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="relative  w-full ">    
      <Outlet />
    </div>
  );
};

export default AuthLayout;
