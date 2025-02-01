import { useNavigate } from 'react-router-dom';
import signUpWithGoogle from '@/services/googleAuth';
import { ClipboardList } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFF9F9] relative overflow-hidden">
    {/* Background Circles */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top left circles */}
      <div className="absolute -left-16 -top-16 md:hidden">
        <div className="w-48 h-48 border border-[#7B1984]/20 rounded-full" />
        <div className="w-36 h-36 border border-[#7B1984]/20 rounded-full absolute top-6 left-6" />
        <div className="w-24 h-24 border border-[#7B1984]/20 rounded-full absolute top-12 left-12" />
      </div>

      {/* Bottom right circles */}
      <div className="absolute -right-16 -bottom-16 md:hidden">
        <div className="w-48 h-48 border border-[#7B1984]/20 rounded-full" />
        <div className="w-36 h-36 border border-[#7B1984]/20 rounded-full absolute bottom-6 right-6" />
        <div className="w-24 h-24 border border-[#7B1984]/20 rounded-full absolute bottom-12 right-12" />
      </div>

      {/* Desktop circles - visible only on md and up */}
      <div className="hidden md:block absolute right-0 top-10">
        <div className="w-[800px] h-[800px] border-0.25 border-[#7b1984b4] rounded-full" />
        <div className="w-[600px] h-[600px] border-0.25 border-[#7b1984b4] rounded-full absolute top-[100px] right-[150px]" />
        <div className="w-[400px] h-[400px] border border-[#7B1984] rounded-full absolute top-[200px] right-[280px]" />
      </div>
    </div>

    {/* Main Content Container */}
    <div className="relative min-h-screen flex flex-col items-center justify-center px-6 md:flex-row md:items-center md:justify-between md:px-16 lg:px-24">
      {/* Left Section: Logo, Text, and Button */}
      <div className="w-full max-w-md space-y-8 text-center md:text-left md:ml-32">
        <div className="space-y-3">
          <div className="flex items-center space-x-2 justify-center md:justify-start">
            <ClipboardList className="text-[#7B1984] text-xl font-bold" />
            <h1 className="text-xl font-bold text-[#7B1984]">TaskBuddy</h1>
          </div>
          <p className="text-xs font-semibold text-gray-600 max-w-[310px] mx-auto md:mx-0">
            Streamline your workflow and track progress effortlessly with our all-in-one task management app.
          </p>
        </div>

        {/* Google Sign In Button */}
        <button
          onClick={() => signUpWithGoogle(navigate)}
          className="w-full md:w-auto flex items-center justify-center space-x-3 bg-gray-900 text-white rounded-xl px-8 md:px-16 py-3 hover:bg-gray-800 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="font-semibold">Continue with Google</span>
        </button>
      </div>

      {/* Right Section: Banner Image - hidden on mobile */}
      <div className="hidden md:block mt-8 -mr-96">
        <img className="object-cover w-11/12" src="Banner.png" alt="Banner" />
      </div>
    </div>
  </div>
  );
};

export default LoginPage;
