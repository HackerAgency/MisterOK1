import React, { useState, useRef } from 'react';
import { X, Upload, FileText, Check } from 'lucide-react';
import { Attachment, Space } from '../types';
import { fileToAttachment } from '../services/geminiService';

interface SpaceModalProps {
  onClose: () => void;
  onSave: (space: Space) => void;
}

const SpaceModal: React.FC<SpaceModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [files, setFiles] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        if (files.length + e.target.files.length > 10) {
            alert("Maximum 10 files allowed");
            return;
        }
        const newAttachments: Attachment[] = [];
        for (let i = 0; i < e.target.files.length; i++) {
            const file = e.target.files[i];
            try {
                const attachment = await fileToAttachment(file);
                newAttachments.push(attachment);
            } catch (err) {
                console.error("Failed to read file", err);
            }
        }
        setFiles(prev => [...prev, ...newAttachments]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = () => {
    if(!name) return;
    onSave({
        id: Date.now().toString(),
        name,
        icon: 'layers',
        systemPrompt: prompt,
        model,
        files
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1f1f22] w-full max-w-2xl rounded-2xl border border-[#333] shadow-2xl p-6 relative animate-fadeIn">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-200">
            <X size={24} />
        </button>

        <h2 className="text-xl font-medium text-gray-100 mb-6">Create new Space</h2>

        <div className="space-y-5">
            <div>
                <label className="block text-sm text-gray-400 mb-2">Space Name</label>
                <input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg p-3 text-gray-200 focus:border-[#2dd4bf] outline-none"
                    placeholder="e.g. Finance Research"
                />
            </div>

            <div>
                <label className="block text-sm text-gray-400 mb-2">System Prompt (Instructions)</label>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg p-3 text-gray-200 focus:border-[#2dd4bf] outline-none h-32 resize-none"
                    placeholder="How should the AI behave in this space?"
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Default Model</label>
                    <select 
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="w-full bg-[#27272a] border border-[#3f3f46] rounded-lg p-3 text-gray-200 focus:border-[#2dd4bf] outline-none appearance-none"
                    >
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                        <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
                        <option value="gemini-2.5-flash-thinking">Gemini 2.5 Flash Thinking</option>
                    </select>
                </div>

                <div>
                     <label className="block text-sm text-gray-400 mb-2">Knowledge Base ({files.length}/10)</label>
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="border border-dashed border-[#3f3f46] rounded-lg p-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-[#27272a] transition-colors text-gray-400"
                     >
                        <Upload size={16} />
                        <span className="text-sm">Upload Files</span>
                     </div>
                     <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                </div>
            </div>

            {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {files.map((f, i) => (
                         <div key={i} className="bg-[#2d2d2d] px-3 py-1 rounded-md text-xs text-gray-300 flex items-center gap-2">
                             <FileText size={12} />
                             <span className="truncate max-w-[150px]">{f.name}</span>
                             <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-400"><X size={12} /></button>
                         </div>
                    ))}
                </div>
            )}
        </div>

        <div className="mt-8 flex justify-end">
            <button 
                onClick={handleSubmit}
                disabled={!name}
                className={`px-6 py-2 rounded-full font-medium flex items-center gap-2 ${name ? 'bg-[#2dd4bf] text-black hover:bg-[#14b8a6]' : 'bg-[#27272a] text-gray-500 cursor-not-allowed'}`}
            >
                <Check size={18} /> Create Space
            </button>
        </div>
      </div>
    </div>
  );
};

export default SpaceModal;