import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JaaSMeeting } from '@jitsi/react-sdk';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '../lib/api';
import type { LiveClass, ApiResponse } from '../types';

export default function LiveClassRoom() {
  const { batchId, liveClassId } = useParams<{ batchId: string; liveClassId: string }>();
  const navigate = useNavigate();
  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [jaasToken, setJaasToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLiveClass(null);
    setJaasToken(null);
    setError(null);
    setLoading(true);

    if (!liveClassId) {
      setError('Live class not found');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadLiveClassAndToken() {
      try {
        const liveClassResponse = await api.get<ApiResponse<LiveClass>>(`/live-classes/${liveClassId}`);

        if (!liveClassResponse.data.success || !liveClassResponse.data.data) {
          if (!cancelled) setError('Live class not found');
          return;
        }

        const loadedLiveClass = liveClassResponse.data.data;
        if (!cancelled) setLiveClass(loadedLiveClass);

        const tokenResponse = await api.post<{ success: boolean; token?: string }>('/meetings/jaas-token', {
          liveClassId: loadedLiveClass.id,
        });

        if (!tokenResponse.data.success || !tokenResponse.data.token) {
          if (!cancelled) setError('Failed to join live class');
          return;
        }

        if (!cancelled) setJaasToken(tokenResponse.data.token);
      } catch {
        if (!cancelled) setError('Failed to load live class');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLiveClassAndToken();

    return () => {
      cancelled = true;
    };
  }, [liveClassId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mx-auto" />
          <p className="text-slate-400 mt-4">Joining class...</p>
        </div>
      </div>
    );
  }

  if (error || !liveClass || !jaasToken) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Live class not found'}</p>
          <button
            onClick={() => navigate(`/dashboard/batches`)}
            className="inline-flex items-center gap-2 text-yellow-300 hover:text-yellow-200 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Batches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      <div className="h-14 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/dashboard/batches/${batchId}`)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-white">{liveClass.title}</h1>
            {liveClass.agenda && (
              <p className="text-xs text-slate-400">{liveClass.agenda}</p>
            )}
          </div>
        </div>
        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded">
          {liveClass.durationMins} min
        </span>
      </div>

      <div className="flex-1">
        <JaaSMeeting
          appId="vpaas-magic-cookie-b8f09e7827fb477c8fe12086fe39caea"
          roomName={liveClass.jitsiRoomName}
          jwt={jaasToken}
          configOverwrite={{
            prejoinPageEnabled: false,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
          }}
          interfaceConfigOverwrite={{
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            TOOLBAR_BUTTONS: [
              'microphone',
              'camera',
              'desktop',
              'fullscreen',
              'fodeviceselection',
              'hangup',
              'chat',
              'raisehand',
              'tileview',
              'settings',
            ],
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = '100%';
            iframeRef.style.width = '100%';
          }}
        />
      </div>
    </div>
  );
}
