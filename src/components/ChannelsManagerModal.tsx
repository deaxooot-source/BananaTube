import React, { useState } from 'react';
import {
  X,
  Tv,
  Plus,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  Check,
  AlertCircle,
  ExternalLink,
  Edit2,
  Sparkles
} from 'lucide-react';
import { ChannelItem } from '../types';
import { resolveYouTubeChannel } from '../utils/youtube';

interface ChannelsManagerModalProps {
  channels: ChannelItem[];
  onAddChannel: (channel: ChannelItem) => void;
  onRemoveChannel: (channelId: string) => void;
  onUpdateChannelName: (channelId: string, customName: string) => void;
  onResetDefaultChannels: () => void;
  onImportChannels: (channels: ChannelItem[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ChannelsManagerModal: React.FC<ChannelsManagerModalProps> = ({
  channels,
  onAddChannel,
  onRemoveChannel,
  onUpdateChannelName,
  onResetDefaultChannels,
  onImportChannels,
  isOpen,
  onClose,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [customNameInput, setCustomNameInput] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState('');

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputVal.trim();
    if (!query) return;

    setErrorMsg('');
    setSuccessMsg('');
    setIsResolving(true);

    try {
      // First check if already in channels
      if (channels.some((c) => c.id === query)) {
        setErrorMsg('هذه القناة موجودة بالفعل في قائمتك!');
        setIsResolving(false);
        return;
      }

      try {
        const data = await resolveYouTubeChannel(query);
        if (channels.some((c) => c.id === data.channelId)) {
          setErrorMsg('هذه القناة موجودة بالفعل في قائمتك!');
          setIsResolving(false);
          return;
        }

        const newChannel: ChannelItem = {
          id: data.channelId,
          title: customNameInput.trim() || data.channelTitle || `قناة ${data.channelId.slice(0, 6)}`,
          avatar: data.avatar || `https://unavatar.io/youtube/${data.channelId}`,
          addedAt: Date.now(),
        };

        onAddChannel(newChannel);
        setSuccessMsg(`تمت إضافة القناة بنجاح: "${newChannel.title}"! 🎉`);
        setInputVal('');
        setCustomNameInput('');
      } catch (error) {
        // If resolver fails, check if input is a valid 24-char UC channel ID
        if (query.startsWith('UC') && query.length >= 22) {
          const newChannel: ChannelItem = {
            id: query,
            title: customNameInput.trim() || `قناة ${query.slice(0, 8)}`,
            avatar: `https://unavatar.io/youtube/${query}`,
            addedAt: Date.now(),
          };
          onAddChannel(newChannel);
          setSuccessMsg(`تمت إضافة القناة بالمعرف: "${newChannel.title}"`);
          setInputVal('');
          setCustomNameInput('');
        } else {
          setErrorMsg(
            error instanceof Error
              ? error.message
              : 'تعذر التعرف على القناة. أدخل معرّف القناة ID الذي يبدأ بـ UC أو رابط القناة.'
          );
        }
      }
    } catch (err: any) {
      setErrorMsg(`حدث خطأ أثناء فحص القناة: ${err.message}`);
    } finally {
      setIsResolving(false);
    }
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(channels, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `banana_tube_channels_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8');
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportChannels(parsed);
            setSuccessMsg(`تم استيراد ${parsed.length} قناة بنجاح!`);
          } else {
            setErrorMsg('ملف غير صالح');
          }
        } catch {
          setErrorMsg('فشل قراءة ملف الـ JSON');
        }
      };
    }
  };

  const startEdit = (c: ChannelItem) => {
    setEditingId(c.id);
    setEditNameText(c.customName || c.title);
  };

  const saveEdit = (cId: string) => {
    onUpdateChannelName(cId, editNameText.trim());
    setEditingId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                إدارة القنوات المتابعة (عدد غير محدود)
              </h2>
              <p className="text-xs text-slate-400">
                لديك حالياً {channels.length} قناة متابعة في بنانا تيوب
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Add Channel Form */}
          <form onSubmit={handleAdd} className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              <span>إضافة قناة جديدة (يدعم ID أو رابط أو @معرف)</span>
            </h3>

            <div className="space-y-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="معرّف القناة (مثال: UC...) أو رابط القناة أو @اسم_المستخدم"
                className="w-full bg-slate-900 border border-slate-750 focus:border-amber-400 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customNameInput}
                  onChange={(e) => setCustomNameInput(e.target.value)}
                  placeholder="اسم مخصص للقناة (اختياري)..."
                  className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-400 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={!inputVal.trim() || isResolving}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-50 transition-all whitespace-nowrap"
                >
                  {isResolving ? (
                    <span>جاري التحقق...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>إضافة القناة</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1 rounded-md text-[11px] whitespace-nowrap"
                >
                  عرض مقاطعها الآن 🚀
                </button>
              </div>
            )}
          </form>

          {/* Channels List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-slate-300">قائمة القنوات المضافة:</span>
              <span className="text-[11px]">يمكنك تعديل الاسم أو حذف أي قناة</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {channels.map((channel, idx) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-950 border border-slate-850 hover:border-slate-700 transition-all gap-2"
                >
                  {/* Channel icon & title */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-amber-400 flex-shrink-0 border border-slate-700 overflow-hidden">
                      {channel.avatar ? (
                        <img
                          src={channel.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingId === channel.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={editNameText}
                            onChange={(e) => setEditNameText(e.target.value)}
                            className="bg-slate-900 border border-amber-400 rounded-lg py-1 px-2 text-xs text-white flex-1 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(channel.id)}
                            className="p-1 rounded bg-amber-500 text-slate-950"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-bold text-slate-200 truncate">
                              {channel.customName || channel.title}
                            </span>
                            <button
                              onClick={() => startEdit(channel)}
                              className="text-slate-400 hover:text-amber-400 p-0.5"
                              title="تعديل اسم القناة"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            {channel.id}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`https://www.youtube.com/channel/${channel.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="فتح على يوتيوب"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => onRemoveChannel(channel.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                      title="حذف القناة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            onClick={onResetDefaultChannels}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
            title="استعادة القنوات الـ 12 الأصلية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة القنوات الأصلية (12 قناة)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors"
              title="تصدير قائمة القنوات لملف JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير نسخة</span>
            </button>

            <label className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>استيراد</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
