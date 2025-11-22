import React from 'react';
import { X, Moon, Monitor, Cpu } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1f1f22] w-full max-w-md rounded-2xl border border-[#333] shadow-2xl p-6 relative animate-fadeIn">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-200">
            <X size={24} />
        </button>

        <h2 className="text-xl font-medium text-gray-100 mb-6">Settings</h2>

        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#2d2d2d]">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#2d2d2d] rounded-lg text-gray-300"><Moon size={20} /></div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-200">Appearance</h3>
                        <p className="text-xs text-gray-500">Theme preferences</p>
                    </div>
                </div>
                <span className="text-xs text-[#2dd4bf]">Dark Mode</span>
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-[#2d2d2d]">
                <div className="flex items-center gap-3">
                     <div className="p-2 bg-[#2d2d2d] rounded-lg text-gray-300"><Cpu size={20} /></div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-200">AI Model Default</h3>
                        <p className="text-xs text-gray-500">Standard generation model</p>
                    </div>
                </div>
                <span className="text-xs text-gray-400">Gemini 2.5 Flash</span>
            </div>

            <div className="p-4 bg-[#27272a] rounded-lg border border-[#3f3f46]">
                <h4 className="text-xs font-semibold text-[#2dd4bf] mb-2 uppercase">System Status</h4>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>API Connection</span>
                    <span className="text-green-400">Active</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                    <span>Pro Features</span>
                    <span className="text-purple-400">Enabled</span>
                </div>
            </div>
        </div>
        
        <div className="mt-6 text-center text-[10px] text-gray-600">
            ОкЪ Эксперт v2.0 • Powered by Google Gemini
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;