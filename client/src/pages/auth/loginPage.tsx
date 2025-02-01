
import signUpWithGoogle from '@/services/googleAuth';
import { Link, useNavigate } from 'react-router-dom';



const LoginPage = () => {
const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
       

        <button onClick={() => signUpWithGoogle(navigate)}>gooogle</button>
        {/* <button onClick={()=>{navigate('/task')}}>gooogle</button> */}
      </div>
    </div>
  );
};

export default LoginPage;