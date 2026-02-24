import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LogIn, User, Lock, ArrowRight, UserPlus, Phone, Hash, GraduationCap, School } from 'lucide-react';
import { authAPI, geographyAPI } from '../api';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [regData, setRegData] = useState({
    name: '',
    rollNumber: '',
    className: '',
    section: '',
    parentPhone: '',
    password: '',
    school: { id: '' }
  });
  const [schools, setSchools] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const response = await geographyAPI.getSchools();
      setSchools(response.data);
    } catch (error) {
      console.error('Error loading schools:', error);
    }
  };

  /* -----------------------------
     Redirect after successful login
  -------------------------------- */
  useEffect(() => {
    if (!user) return;

    const roleRoutes = {
      SUPER_ADMIN: '/admin/dashboard',
      DISTRICT_ADMIN: '/admin/dashboard',
      BLOCK_ADMIN: '/admin/dashboard',
      SCHOOL_ADMIN: '/school/dashboard',
      TEACHER: '/teacher/dashboard',
      STUDENT: '/student/dashboard',
      PARENT: '/student/dashboard',
    };

    navigate(roleRoutes[user.role] || '/dashboard', { replace: true });
  }, [user, navigate]);

  /* -----------------------------
     Handle Login Submit
  -------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(credentials);

    if (!result.success) {
      setError(result.error || 'Invalid credentials');
    }

    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!regData.school.id) {
        throw new Error('Please select a school');
      }
      await authAPI.submitStudentRequest(regData);
      toast.success('Registration request submitted to your teacher!');
      setIsRegister(false);
      setRegData({
        name: '',
        rollNumber: '',
        className: '',
        section: '',
        parentPhone: '',
        password: '',
        school: { id: '' }
      });
    } catch (err) {
      setError(err.response?.data || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfdfd] py-12 px-4 sm:px-6 lg:px-8 overflow-x-hidden relative">
      {/* Background Animations */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200 rounded-full blur-[120px] -z-10"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ duration: 3, delay: 1, repeat: Infinity, repeatType: 'reverse' }}
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-200 rounded-full blur-[120px] -z-10"
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-[2.5rem] p-8 md:p-10 shadow-2xl backdrop-blur-xl border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl mb-6">
              {isRegister ? <UserPlus className="w-8 h-8 text-white" /> : <LogIn className="w-8 h-8 text-white" />}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{isRegister ? 'Student Registration' : 'Welcome Back'}</h1>
            <p className="text-slate-500 mt-2">Enterprise Attendance Management</p>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${!isRegister ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${isRegister ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Student Register
            </button>
          </div>

          <form onSubmit={isRegister ? handleRegister : handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {isRegister ? (
                <motion.div
                  key="register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 gap-4">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={regData.name}
                        onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Roll Number"
                        value={regData.rollNumber}
                        onChange={(e) => setRegData({ ...regData, rollNumber: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Class"
                          value={regData.className}
                          onChange={(e) => setRegData({ ...regData, className: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                          required
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Section"
                        value={regData.section}
                        onChange={(e) => setRegData({ ...regData, section: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                        required
                      />
                    </div>
                    <div className="relative">
                      <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <select
                        value={regData.school.id}
                        onChange={(e) => setRegData({ ...regData, school: { id: e.target.value } })}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none transition-all cursor-pointer"
                        required
                      >
                        <option value="">Select Your School</option>
                        {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="tel"
                        placeholder="Parent Phone"
                        value={regData.parentPhone}
                        onChange={(e) => setRegData({ ...regData, parentPhone: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="password"
                        placeholder="Create Password"
                        value={regData.password}
                        onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Username"
                        value={credentials.username}
                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        placeholder="Password"
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-medium border border-red-100 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl flex justify-center items-center gap-2 font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? (isRegister ? 'Submitting...' : 'Signing in...') : (isRegister ? 'Submit Request' : 'Sign In')}
              <ArrowRight className={`w-5 h-5 ${loading ? 'animate-pulse' : ''}`} />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
