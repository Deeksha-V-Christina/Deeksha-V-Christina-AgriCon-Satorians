import React, { useState } from 'react';
import { X, UserCheck, Calendar, Clock, Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';
import { MarketItem } from '../types';
import { formatPriceToInr } from './CommunityView';

interface ConsultExpertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsultExpertModal: React.FC<ConsultExpertModalProps> = ({ isOpen, onClose }) => {
  const [topic, setTopic] = useState('Crop Pathology & Pest Identification');
  const [date, setDate] = useState('2026-09-02');
  const [time, setTime] = useState('10:00 AM');
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-[#e1e3e4] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-[#012d1d] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#a0f4c8] flex items-center justify-center text-[#012d1d]">
              <UserCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-white">Consult Agronomy Specialist</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 text-xs text-[#414844]">
          {confirmed ? (
            <div className="text-center py-6 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#c1ecd4] flex items-center justify-center text-[#012d1d]">
                <CheckCircle2 className="w-8 h-8 text-[#012d1d]" />
              </div>
              <h4 className="text-base font-bold text-[#012d1d]">Consultation Confirmed!</h4>
              <p className="text-xs text-[#414844] max-w-xs">
                Dr. Elena Vance (Lead Certified Agronomist) will join you via video call on <strong>{date}</strong> at <strong>{time}</strong>.
              </p>
              <button
                onClick={onClose}
                className="mt-3 px-6 py-2.5 rounded-full bg-[#012d1d] text-white font-bold text-xs shadow-md"
              >
                Add to Calendar
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-[#414844]">
                Schedule a 1-on-1 video diagnosis review with our licensed regional crop specialists.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#414844] uppercase">Select Specialization</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#191c1d]"
                >
                  <option>Crop Pathology &amp; Pest Identification</option>
                  <option>Soil Chemistry &amp; NPK Formulation</option>
                  <option>Drone Multispectral Thermal Analysis</option>
                  <option>Irrigation &amp; Evapotranspiration Models</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#414844] uppercase">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl px-3 py-2 text-xs font-bold text-[#191c1d]"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-[#414844] uppercase">Time</label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl px-3 py-2 text-xs font-bold text-[#191c1d]"
                  >
                    <option>09:00 AM</option>
                    <option>10:00 AM</option>
                    <option>02:00 PM</option>
                    <option>04:30 PM</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-[#c1ecd4]/25 rounded-2xl border border-[#c1ecd4] flex items-center justify-between font-medium">
                <span>Agronomist Fee:</span>
                <span className="font-bold text-[#012d1d]">Free Agricon Advisory (₹0 / Free)</span>
              </div>

              <button
                onClick={() => setConfirmed(true)}
                className="w-full py-3 bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold text-xs rounded-full shadow-md transition-transform active:scale-95 mt-1"
              >
                Confirm Consultation
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

interface ContactSellerModalProps {
  item: MarketItem | null;
  onClose: () => void;
}

export const ContactSellerModal: React.FC<ContactSellerModalProps> = ({ item, onClose }) => {
  const [message, setMessage] = useState("Hi! I'm interested in your listing on Agricon. Is this still available for pickup this week?");
  const [sent, setSent] = useState(false);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-[#e1e3e4] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-[#012d1d] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#a0f4c8] flex items-center justify-center text-[#012d1d]">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Contact Seller</h3>
              <p className="text-[11px] text-[#a0f4c8]">{item.seller} • {item.location}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 text-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 text-xs text-[#414844]">
          {sent ? (
            <div className="text-center py-6 flex flex-col items-center gap-2">
              <CheckCircle2 className="w-10 h-10 text-[#2c694e]" />
              <h4 className="font-bold text-sm text-[#012d1d]">Inquiry Sent!</h4>
              <p className="text-xs text-[#717973]">
                {item.seller} has been notified and will reply to your registered phone &amp; in-app messenger.
              </p>
              <button
                onClick={onClose}
                className="mt-3 px-5 py-2 bg-[#012d1d] text-white font-bold text-xs rounded-full"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-[#f8f9fa] rounded-2xl border border-[#e1e3e4]">
                <img src={item.imageUrl} alt={item.title} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <h4 className="font-bold text-xs text-[#191c1d]">{item.title}</h4>
                  <span className="font-extrabold text-[#012d1d] text-xs bg-[#d8f3dc] px-2 py-0.5 rounded border border-[#a7e3b8] inline-block mt-0.5">
                    {formatPriceToInr(item.price)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#414844] uppercase">Your Message</label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-[#e1e3e4] rounded-2xl p-3 text-xs text-[#191c1d] focus:outline-none focus:border-[#012d1d] font-medium"
                />
              </div>

              <button
                onClick={() => setSent(true)}
                className="w-full py-3 bg-[#012d1d] hover:bg-[#1b4332] text-white font-bold text-xs rounded-full shadow-md transition-transform active:scale-95"
              >
                Send Message
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
