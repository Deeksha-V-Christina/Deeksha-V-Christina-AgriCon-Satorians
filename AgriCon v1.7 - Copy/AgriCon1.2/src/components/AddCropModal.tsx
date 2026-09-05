import React, { useState } from 'react';
import { CropItem } from '../types';
import { X, Sprout, Plus, Check } from 'lucide-react';

interface AddCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCrop: (crop: CropItem) => void;
}

export const AddCropModal: React.FC<AddCropModalProps> = ({ isOpen, onClose, onAddCrop }) => {
  const [name, setName] = useState('Barley');
  const [field, setField] = useState('Field D');
  const [quadrant, setQuadrant] = useState('South Hill');
  const [areaHa, setAreaHa] = useState(10.0);
  const [moisturePercent, setMoisturePercent] = useState(55);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCrop: CropItem = {
      id: `crop-${Date.now()}`,
      name,
      field,
      quadrant,
      day: 1,
      status: moisturePercent < 30 ? 'Needs Water' : 'Healthy',
      moisturePercent,
      imageUrl:
        name.toLowerCase().includes('barley')
          ? 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80'
          : 'https://images.unsplash.com/photo-1599818816942-88152592fa44?auto=format&fit=crop&w=800&q=80',
      plantingDate: 'Today',
      expectedHarvest: 'In 90 Days',
      areaHa,
    };
    onAddCrop(newCrop);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-[#e1e3e4] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-[#012d1d] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#a0f4c8] flex items-center justify-center text-[#012d1d]">
              <Sprout className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-white">Add New Crop Plot</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#414844] uppercase">Crop Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#191c1d] focus:outline-none focus:border-[#012d1d]"
              placeholder="e.g. Barley, Canola, Sorghum"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#414844] uppercase">Field / Sector</label>
              <input
                type="text"
                required
                value={field}
                onChange={(e) => setField(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#191c1d]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#414844] uppercase">Quadrant</label>
              <input
                type="text"
                required
                value={quadrant}
                onChange={(e) => setQuadrant(e.target.value)}
                className="w-full bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl px-4 py-2.5 text-sm font-semibold text-[#191c1d]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-bold text-[#414844]">
              <span>PLOT SIZE: {areaHa} HA</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="0.5"
              value={areaHa}
              onChange={(e) => setAreaHa(parseFloat(e.target.value))}
              className="w-full accent-[#012d1d] h-2 bg-[#edeeef] rounded-lg"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-bold text-[#414844]">
              <span>INITIAL SOIL MOISTURE: {moisturePercent}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="1"
              value={moisturePercent}
              onChange={(e) => setMoisturePercent(parseInt(e.target.value))}
              className="w-full accent-[#2c694e] h-2 bg-[#edeeef] rounded-lg"
            />
          </div>

          <div className="mt-4 flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#717973] hover:text-[#191c1d]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-[#a0f4c8]" />
              <span>Add to Farm Tracker</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
