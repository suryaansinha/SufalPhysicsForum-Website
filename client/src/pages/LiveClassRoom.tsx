import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '../lib/api';
import type { LiveClass, ApiResponse } from '../types';

export default function LiveClassRoom() {
  const { batchId, liveClassId } = useParams<{ batchId: string; liveClassId: string }>();
  const navigate = useNavigate();
  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!liveClassId) return;

    api
      .get<ApiResponse<LiveClass>>(`/live-classes/${liveClassId}`)
      .then((res) => {
        if (res.data.success && res.data.data) {
          setLiveClass(res.data.data);
        } else {
          setError('Live class not found');
        }
      })
      .catch(() => setError('Failed to load live class'))
      .finally(() => setLoading(false));
  }, [liveClassId]);

  const userName = localStorage.getItem('userName') || 'User';
  const userEmail = localStorage.getItem('userEmail') || '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">Joining class...</p>
        </div>
      </div>
    );
  }

  if (error || !liveClass) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Live class not found'}</p>
          <button
            onClick={() => navigate(`/dashboard/batches`)}
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Batches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/dashboard/batches/${batchId}`)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-white">{liveClass.title}</h1>
            {liveClass.agenda && (
              <p className="text-xs text-gray-400">{liveClass.agenda}</p>
            )}
          </div>
        </div>
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
          {liveClass.durationMins} min
        </span>
      </div>

      <div className="flex-1">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={liveClass.jitsiRoomName}
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
          userInfo={{
            displayName: userName,
            email: userEmail,
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
