import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QuizSection from '../components/admin/QuizSection';
import VocabSection from '../components/admin/VocabSection';
import AchievementSection from '../components/admin/AchievementSection';
import UserSection from '../components/admin/UserSection';

const TABS = ['Quiz', 'Vocabulary', 'Achievement', 'User'];

const AdminPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Quiz');

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/auth');
  };

  return (
  <div className="container-fluid py-4 auth-page">

    <div className="d-flex justify-content-between align-items-center mb-4">
      <h2 className="mb-0">GoiHunt Admin Dashboard</h2>
      <button type="button" className="btn btn-danger btn" onClick={handleLogout}>
        Logout
      </button>
    </div>

    <div className='bg-white py-2 rounded-top'>
      <ul className="nav nav-tabs">
        {TABS.map(tab => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link ${activeTab === tab ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                borderBottom: activeTab === tab ? '2px solid' : 'none',
                color: activeTab === tab ? 'blue' : '#999',
                margin: '0 8px'
              }}
            >
              {tab}
            </button>
          </li>
        ))}
      </ul>
      
      <div style={{padding: '2rem', background: '#fff', minHeight: '400px'}}>
        {activeTab === 'Quiz'        && <QuizSection />}
        {activeTab === 'Vocabulary'  && <VocabSection />}
        {activeTab === 'Achievement' && <AchievementSection />}
        {activeTab === 'User'        && <UserSection />}
      </div>
    </div>
  </div>
);
};

export default AdminPage;
