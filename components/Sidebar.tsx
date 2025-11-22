import React from 'react';
import { Plus, Search, Library, Layers, Settings } from 'lucide-react';

interface SidebarProps {
  activeView: 'home' | 'library' | 'spaces';
  onNavigate: (view: 'home' | 'library' | 'spaces') => void;
  onNewChat: () => void;
  onSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, onNavigate, onNewChat, onSettings }) => {
  return (
    <div className="flex flex-col h-full w-16 sm:w-20 bg-[#18181b] border-r border-[#27272a] items-center py-4 gap-6 flex-shrink-0 z-50">
      {/* Logo Icon */}
      <div className="mb-2 cursor-pointer" onClick={() => onNavigate('home')}>
        <div className="w-10 h-10 bg-transparent flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#2dd4bf"/>
                <path d="M2 17L12 22L22 17" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
      </div>

      {/* New Thread Button */}
      <button 
        onClick={onNewChat}
        className="w-10 h-10 rounded-full bg-[#27272a] hover:bg-white hover:text-black text-gray-400 flex items-center justify-center transition-all duration-200"
        title="New Thread"
      >
        <Plus size={24} />
      </button>

      {/* Nav Items */}
      <div className="flex flex-col gap-4 w-full items-center mt-2">
        <NavItem 
            icon={<Search size={24} />} 
            label="Home" 
            active={activeView === 'home'} 
            onClick={() => onNavigate('home')} 
        />
        <NavItem 
            icon={<Layers size={24} />} 
            label="Spaces" 
            active={activeView === 'spaces'} 
            onClick={() => onNavigate('spaces')} 
        />
        <NavItem 
            icon={<Library size={24} />} 
            label="Library" 
            active={activeView === 'library'} 
            onClick={() => onNavigate('library')} 
        />
      </div>

      <div className="flex-1" />

      {/* Footer Items */}
      <div className="flex flex-col gap-4 w-full items-center pb-4">
        <button 
            onClick={onSettings}
            className="text-gray-500 hover:text-gray-200 transition-colors"
        >
            <Settings size={24} />
        </button>
        <button className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
           AI
        </button>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`p-2 rounded-lg transition-colors flex flex-col items-center gap-1 ${active ? 'text-[#2dd4bf]' : 'text-gray-500 hover:text-gray-200'}`}
    title={label}
  >
    {icon}
    <span className="text-[10px] font-medium hidden sm:block">{label}</span>
  </button>
);

export default Sidebar;