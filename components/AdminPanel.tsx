import React, { useState, useEffect } from 'react';
import { Lock, Users, Activity, UploadCloud, DollarSign, LogOut } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Check for existing session on mount
  useEffect(() => {
      const session = sessionStorage.getItem('admin_session');
      if (session === 'active') {
          setIsAuthenticated(true);
      }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'NHYA' && password === '239486*') {
        setIsAuthenticated(true);
        sessionStorage.setItem('admin_session', 'active');
    } else {
        alert("Invalid credentials. Access Denied.");
    }
  };

  const handleLogout = () => {
      sessionStorage.removeItem('admin_session');
      setIsAuthenticated(false);
      onLogout();
  };

  if (!isAuthenticated) {
      return (
          <div className="min-h-[60vh] flex items-center justify-center bg-gray-50">
              <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
                  <div className="flex justify-center mb-6">
                      <div className="bg-slate-900 p-3 rounded-full">
                          <Lock className="w-6 h-6 text-white" />
                      </div>
                  </div>
                  <h2 className="text-xl font-bold text-center mb-6 text-slate-900">Restricted Access</h2>
                  <div className="space-y-4">
                      <input 
                        type="text" 
                        placeholder="Username" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                      <input 
                        type="password" 
                        placeholder="Password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                      <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800 font-bold">
                          Authenticate
                      </button>
                  </div>
              </form>
          </div>
      );
  }

  // MOCK DATA for Admin View (Since no backend)
  const stats = [
      { label: 'Total Users', value: '1,243', icon: Users, color: 'bg-blue-500' },
      { label: 'Monthly Active', value: '856', icon: Activity, color: 'bg-green-500' },
      { label: 'Files Uploaded', value: '4,102', icon: UploadCloud, color: 'bg-purple-500' },
      { label: 'Revenue (MTD)', value: '$12,450', icon: DollarSign, color: 'bg-emerald-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <button onClick={handleLogout} className="flex items-center gap-2 text-rose-600 hover:text-rose-700 font-medium">
                <LogOut className="w-4 h-4" /> Secure Exit
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 uppercase">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                            <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                        </div>
                    </div>
                </div>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4">Recent Activity</h3>
                <ul className="space-y-4">
                    {[1,2,3,4,5].map(i => (
                        <li key={i} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                            <span className="text-slate-600">New analysis run by User-{1000+i}</span>
                            <span className="text-slate-400">{i * 5}m ago</span>
                        </li>
                    ))}
                </ul>
            </div>
            
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-900 mb-4">Subscription Distribution</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Free Users</span>
                            <span>78%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-slate-400 h-2 rounded-full" style={{width: '78%'}}></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-sm mb-1">
                            <span>Pro Subscribers</span>
                            <span>22%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{width: '22%'}}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};