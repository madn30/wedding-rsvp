import { useState } from 'react';
import { Guest, MessageChannel } from '../../types';
import { ResponseBadge, Spinner } from '../ui';
import { sendInvitation, deleteGuest } from '../../services/guestService';
import toast from 'react-hot-toast';

interface GuestTableProps {
  guests: Guest[];
  onRefresh: () => void;
}

export const GuestTable = ({ guests, onRefresh }: GuestTableProps) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSend = async (guest: Guest, channel: MessageChannel) => {
    setLoadingId(guest._id);
    try {
      await sendInvitation(guest._id, channel);
      toast.success(`הזמנה נשלחה ל${guest.name} 📨`);
      onRefresh();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message || 'שגיאה בשליחה';
      toast.error(msg);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (guest: Guest) => {
    if (!confirm(`למחוק את ${guest.name}?`)) return;
    try {
      await deleteGuest(guest._id);
      toast.success('האורח נמחק');
      onRefresh();
    } catch {
      toast.error('שגיאה במחיקה');
    }
  };

  if (guests.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-4xl mb-2">👥</p>
        <p>לא נמצאו אורחים</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {['שם', 'טלפון', 'תשובה', 'הודעה', 'תאריך תשובה', 'פעולות'].map((h) => (
              <th key={h} className="text-right px-4 py-3 font-medium text-gray-600">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {guests.map((guest) => (
            <tr key={guest._id} className="hover:bg-rose-50/30 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-800">{guest.name}</td>
              <td className="px-4 py-3 text-gray-600 font-mono text-xs" dir="ltr">
                {guest.phone}
              </td>
              <td className="px-4 py-3">
                <ResponseBadge response={guest.response} />
              </td>
              <td className="px-4 py-3">
                {guest.messageSent ? (
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    {guest.messageChannel === 'whatsapp' ? '📱 WhatsApp' : '📨 SMS'}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">לא נשלח</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-500 text-xs">
                {guest.respondedAt
                  ? new Date(guest.respondedAt).toLocaleDateString('he-IL')
                  : '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {loadingId === guest._id ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <button
                        onClick={() => handleSend(guest, 'sms')}
                        title="שלח SMS"
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
                      >
                        📨
                      </button>
                      <button
                        onClick={() => handleSend(guest, 'whatsapp')}
                        title="שלח WhatsApp"
                        className="p-1.5 rounded-lg hover:bg-green-50 text-green-500 transition-colors"
                      >
                        📱
                      </button>
                      <a
                        href={`/rsvp/${guest.token}`}
                        target="_blank"
                        rel="noreferrer"
                        title="צפה בלינק"
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                      >
                        🔗
                      </a>
                      <button
                        onClick={() => handleDelete(guest)}
                        title="מחק"
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
