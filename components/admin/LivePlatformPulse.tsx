'use client';
import { useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { EVENT_CONFIG } from '@/lib/platformEvents';

interface PlatformEvent {
  id: string;
  event_type: string;
  business_name: string;
  city: string;
  metadata: Record<string, any>;
  created_at: string;
}

export const LivePlatformPulse = () => {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [isLive, setIsLive] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);

  // Fetch last 20 events on mount
  useEffect(() => {
    const fetchRecent = async () => {
      const { data } = await supabase
        .from('platform_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setEvents(data.reverse());
    };
    fetchRecent();
  }, [supabase]);

  // Subscribe to realtime
  useEffect(() => {
    if (!isLive) return;

    const channel = supabase
      .channel('platform_pulse')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'platform_events' },
        (payload) => {
          const newEvent = payload.new as PlatformEvent;
          setEvents((prev) => {
            const updated = [...prev, newEvent];
            return updated.slice(-50); // keep max 50 in memory
          });
          // Auto-scroll to bottom
          setTimeout(() => {
            feedRef.current?.scrollTo({
              top: feedRef.current.scrollHeight,
              behavior: 'smooth',
            });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, isLive]);

  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-250/80 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {isLive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            )}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isLive ? 'bg-green-500' : 'bg-gray-400'}`} />
          </span>
          <h3 className="font-bold text-gray-900 text-sm">
            Live Platform Pulse
          </h3>
          <span className="text-xs text-gray-400 font-bold">
            {events.length} events
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setEvents([])}
            className="text-xs text-gray-400 hover:text-gray-600 font-bold cursor-pointer"
          >
            Clear
          </button>
          <button
            onClick={() => setIsLive((v) => !v)}
            className={`text-xs px-3 py-1 rounded-full border font-bold cursor-pointer transition-all duration-200
              ${isLive
                ? 'border-green-300 text-green-700 bg-green-50'
                : 'border-gray-300 text-gray-600 bg-gray-50'
              }`}
          >
            {isLive ? '● Live' : '○ Paused'}
          </button>
        </div>
      </div>

      {/* Feed */}
      <div
        ref={feedRef}
        className="h-64 overflow-y-auto px-4 py-3 space-y-2.5 scroll-smooth"
      >
        {events.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-gray-400 font-bold">
              Waiting for platform activity...
            </p>
          </div>
        ) : (
          events.map((event) => {
            const config = EVENT_CONFIG[event.event_type];
            if (!config) return null;
            return (
              <div
                key={event.id}
                className={`flex items-start gap-2.5 px-3 py-2 rounded-xl border text-xs font-semibold
                            animate-in slide-in-from-bottom-2 duration-300 ${config.color}`}
              >
                <span className="text-base leading-none mt-0.5">
                  {config.emoji}
                </span>
                <span className="flex-1 leading-relaxed text-left">
                  {config.label(
                    event.metadata,
                    event.business_name,
                    event.city
                  )}
                </span>
                <span className="text-gray-400 whitespace-nowrap ml-2 font-mono text-[10px]">
                  {formatTime(event.created_at)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
