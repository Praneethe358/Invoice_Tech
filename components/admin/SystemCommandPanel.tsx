'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface Shop {
  id: string;
  name: string;
  is_frozen: boolean;
  frozen_reason: string | null;
}

interface Announcement {
  id: string;
  message: string;
  is_active: boolean;
}

export const SystemCommandPanel = () => {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  const [pin, setPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState('');

  // Announcement State
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [newMsg, setNewMsg] = useState('');
  const [announcementLoading, setAnnouncementLoading] = useState(false);

  // Shop Freeze State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [freezeReason, setFreezeReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const targetPin = process.env.NEXT_PUBLIC_ADMIN_COMMAND_PIN || '689844';

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === targetPin) {
      setIsUnlocked(true);
      setPinError('');
    } else {
      setPinError('Invalid Admin PIN');
    }
  };

  // Fetch active announcement
  const fetchActiveAnnouncement = async () => {
    const { data } = await supabase
      .from('system_announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setAnnouncement(data[0]);
    } else {
      setAnnouncement(null);
    }
  };

  useEffect(() => {
    if (isUnlocked) {
      fetchActiveAnnouncement();
    }
  }, [isUnlocked]);

  // Search shops via route handler to respect RLS
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/shops?search=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.shops) {
          setSearchResults(data.shops);
        }
      } catch (err) {
        console.error('Error searching shops:', err);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Publish Announcement
  const handlePublishAnnouncement = async () => {
    if (!newMsg.trim()) return;
    setAnnouncementLoading(true);
    try {
      // Deactivate other announcements
      await supabase
        .from('system_announcements')
        .update({ is_active: false })
        .eq('is_active', true);

      // Insert new one
      const { data, error } = await supabase
        .from('system_announcements')
        .insert({ message: newMsg.trim(), is_active: true })
        .select()
        .single();

      if (error) throw error;
      setAnnouncement(data);
      setNewMsg('');
    } catch (err: any) {
      alert(`Error publishing announcement: ${err.message}`);
    } finally {
      setAnnouncementLoading(false);
    }
  };

  // Retract Announcement
  const handleRetractAnnouncement = async () => {
    if (!announcement) return;
    setAnnouncementLoading(true);
    try {
      const { error } = await supabase
        .from('system_announcements')
        .update({ is_active: false })
        .eq('id', announcement.id);

      if (error) throw error;
      setAnnouncement(null);
    } catch (err: any) {
      alert(`Error retracting announcement: ${err.message}`);
    } finally {
      setAnnouncementLoading(false);
    }
  };

  // Freeze Selected Shop
  const handleFreezeShop = async () => {
    if (!selectedShop || !freezeReason.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/shops/${selectedShop.id}/freeze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: freezeReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to freeze shop');

      setSelectedShop({
        ...selectedShop,
        is_frozen: true,
        frozen_reason: freezeReason.trim(),
      });
      setFreezeReason('');
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Unfreeze Selected Shop
  const handleUnfreezeShop = async () => {
    if (!selectedShop) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/shops/${selectedShop.id}/unfreeze`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to unfreeze shop');

      setSelectedShop({
        ...selectedShop,
        is_frozen: false,
        frozen_reason: null,
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 max-w-sm mx-auto">
        <h3 className="font-bold text-gray-900 text-sm mb-4 text-center">
          🔓 System Command Panel
        </h3>
        <form onSubmit={handleUnlock} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter Admin PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full text-center py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {pinError && (
              <p className="text-xs text-red-500 mt-1 text-center font-bold">
                {pinError}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-xl cursor-pointer"
          >
            Unlock Command Panel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-250/80 shadow-xs p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="text-base">🛠️</span>
          <h3 className="font-bold text-gray-900 text-sm">
            System Command Panel
          </h3>
        </div>
        <button
          onClick={() => setIsUnlocked(false)}
          className="text-xs text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
        >
          Lock Panel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Announce Station */}
        <div className="space-y-4 border-r border-gray-100 pr-0 md:pr-6">
          <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
            📢 Announce Station
          </h4>
          {announcement ? (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl space-y-3">
              <p className="text-xs font-semibold leading-relaxed">
                <strong>Active Announcement:</strong> {announcement.message}
              </p>
              <button
                onClick={handleRetractAnnouncement}
                disabled={announcementLoading}
                className="bg-red-650 hover:bg-red-700 text-white text-[10px] font-black px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-50"
              >
                {announcementLoading ? 'Retracting...' : 'Retract Announcement'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                placeholder="Type active system announcement banner text here..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handlePublishAnnouncement}
                disabled={announcementLoading || !newMsg.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {announcementLoading ? 'Publishing...' : 'Publish Announcement'}
              </button>
            </div>
          )}
        </div>

        {/* Emergency Lock (Kill Switch) */}
        <div className="space-y-4">
          <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider">
            🚨 Emergency Lock (Kill Switch)
          </h4>

          {/* Search shop */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search business to freeze/unfreeze..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-40 overflow-y-auto">
                {searchResults.map((shop) => (
                  <button
                    key={shop.id}
                    onClick={() => {
                      setSelectedShop(shop);
                      setSearchResults([]);
                      setSearchQuery('');
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    {shop.name} {shop.is_frozen ? '🔴' : '🟢'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Shop Control */}
          {selectedShop && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">
                    {selectedShop.name}
                  </h5>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    ID: {selectedShop.id}
                  </p>
                </div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black border uppercase
                    ${selectedShop.is_frozen
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-green-50 border-green-200 text-green-700'
                    }`}
                >
                  {selectedShop.is_frozen ? 'FROZEN' : 'ACTIVE'}
                </span>
              </div>

              {selectedShop.is_frozen ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-red-700">
                    Frozen Reason: {selectedShop.frozen_reason || 'No reason specified'}
                  </p>
                  <button
                    onClick={handleUnfreezeShop}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? 'Unfreezing...' : 'Unfreeze Account'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter reason for freezing..."
                    value={freezeReason}
                    onChange={(e) => setFreezeReason(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white focus:outline-none"
                  />
                  <button
                    onClick={handleFreezeShop}
                    disabled={actionLoading || !freezeReason.trim()}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? 'Freezing...' : 'Freeze Account (Kill Switch)'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
