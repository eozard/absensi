/*
 * Logbook Harian Mahasiswa (terintegrasi dengan absensi)
 *
 * Alur kerja:
 * 1. User membuka halaman ini -> otomatis load logbook hari ini (atau draft kosong).
 * 2. Form: judul, kegiatan, jam mulai/selesai, hasil, kendala.
 * 3. Tombol "Simpan Draft" -> POST/PUT (status: draft).
 * 4. Tombol "Submit untuk Review" -> POST /submit (status: submitted).
 * 5. Tombol "Lihat Riwayat" -> tab history (30 hari terakhir).
 *
 * Validasi status:
 * - draft / rejected : bisa diedit & disubmit ulang
 * - submitted : sedang direview admin (readonly)
 * - approved : disetujui admin (readonly)
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Loader2,
  BookOpen,
  Save,
  Send,
  Trash2,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  History,
  Edit3,
} from "lucide-react";
import axiosInstance from "../utils/axios";
import ToastStack from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../hooks/useToast";

const STATUS_BADGE = {
  draft: { label: "Draft", className: "badge-blue" },
  submitted: { label: "Menunggu Review", className: "badge-yellow" },
  approved: { label: "Disetujui", className: "badge-green" },
  rejected: { label: "Ditolak", className: "badge-red" },
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const LogbookPage = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("today"); // today | history
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const { toasts, pushToast, dismissToast } = useToast();
  const navigate = useNavigate();

  // Form state (diinisialisasi setelah fetch)
  const [entry, setEntry] = useState({
    id: null,
    tanggal: "",
    judul: "",
    kegiatan: "",
    jam_mulai: "",
    jam_selesai: "",
    hasil: "",
    kendala: "",
    status: "draft",
    reviewed_by: null,
    reviewed_at: null,
    catatan_reviewer: null,
    absensi_info: [],
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) {
      navigate("/");
      return;
    }
    setUser(storedUser);
    fetchToday();
  }, []);

  const fetchToday = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/logbook/today");
      if (res.data.success) {
        setEntry({
          id: res.data.data.id,
          tanggal: res.data.data.tanggal,
          judul: res.data.data.judul || "",
          kegiatan: res.data.data.kegiatan || "",
          jam_mulai: res.data.data.jam_mulai || "",
          jam_selesai: res.data.data.jam_selesai || "",
          hasil: res.data.data.hasil || "",
          kendala: res.data.data.kendala || "",
          status: res.data.data.status || "draft",
          reviewed_by: res.data.data.reviewed_by,
          reviewed_at: res.data.data.reviewed_at,
          catatan_reviewer: res.data.data.catatan_reviewer,
          absensi_info: res.data.data.absensi_info || [],
        });
      }
    } catch (error) {
      pushToast({
        type: "error",
        title: "Gagal memuat logbook",
        message: error.response?.data?.message || "Server error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await axiosInstance.get("/logbook/history?days=60");
      if (res.data.success) {
        setHistory(res.data.data || []);
      }
    } catch (error) {
      pushToast({
        type: "error",
        title: "Gagal memuat riwayat",
        message: error.response?.data?.message || "Server error",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEntry((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    if (!entry.judul.trim() || !entry.kegiatan.trim()) {
      pushToast({
        type: "warning",
        title: "Lengkapi dulu",
        message: "Judul dan kegiatan wajib diisi",
      });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        judul: entry.judul,
        kegiatan: entry.kegiatan,
        jam_mulai: entry.jam_mulai || null,
        jam_selesai: entry.jam_selesai || null,
        hasil: entry.hasil,
        kendala: entry.kendala,
      };
      let res;
      if (entry.id) {
        res = await axiosInstance.put(`/logbook/${entry.id}`, payload);
      } else {
        res = await axiosInstance.post("/logbook", {
          ...payload,
          tanggal: entry.tanggal,
        });
      }
      if (res.data.success) {
        pushToast({
          type: "success",
          title: "Draft tersimpan",
          message: res.data.message,
        });
        await fetchToday();
      }
    } catch (error) {
      pushToast({
        type: "error",
        title: "Gagal menyimpan",
        message: error.response?.data?.message || "Server error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = () => {
    if (!entry.judul.trim() || !entry.kegiatan.trim()) {
      pushToast({
        type: "warning",
        title: "Lengkapi dulu",
        message: "Judul dan kegiatan wajib diisi",
      });
      return;
    }
    if (!entry.id) {
      pushToast({
        type: "warning",
        title: "Simpan dulu",
        message: "Simpan draft terlebih dahulu sebelum submit",
      });
      return;
    }
    setConfirmState({
      title: "Submit Logbook?",
      message:
        "Logbook akan dikirim ke admin/pembimbing untuk direview. Anda masih bisa edit jika ditolak.",
      confirmText: "Submit",
      tone: "primary",
      onConfirm: async () => {
        setSubmitting(true);
        try {
          const res = await axiosInstance.post(
            `/logbook/${entry.id}/submit`,
          );
          if (res.data.success) {
            pushToast({
              type: "success",
              title: "Logbook disubmit",
              message: res.data.message,
            });
            await fetchToday();
          }
        } catch (error) {
          pushToast({
            type: "error",
            title: "Gagal submit",
            message: error.response?.data?.message || "Server error",
          });
        } finally {
          setSubmitting(false);
        }
      },
    });
  };

  const handleDelete = () => {
    if (!entry.id) return;
    setConfirmState({
      title: "Hapus Draft?",
      message: "Draft logbook untuk hari ini akan dihapus permanen.",
      confirmText: "Hapus",
      tone: "danger",
      onConfirm: async () => {
        try {
          const res = await axiosInstance.delete(`/logbook/${entry.id}`);
          if (res.data.success) {
            pushToast({
              type: "success",
              title: "Dihapus",
              message: res.data.message,
            });
            await fetchToday();
          }
        } catch (error) {
          pushToast({
            type: "error",
            title: "Gagal menghapus",
            message: error.response?.data?.message || "Server error",
          });
        }
      },
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("deviceId");
    navigate("/");
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const isEditable =
    !entry.id || entry.status === "draft" || entry.status === "rejected";

  const attendanceBadge = () => {
    const info = entry.absensi_info || [];
    if (info.length === 0) {
      return (
        <span className="badge-red">
          <XCircle className="w-3 h-3 mr-1" /> Belum Absen
        </span>
      );
    }
    const hasHadir = info.some((a) => a.status === "hadir");
    const hasIzin = info.some(
      (a) => a.status === "izin" && a.status_approval === "approved",
    );
    if (hasHadir) {
      return (
        <span className="badge-green">
          <CheckCircle className="w-3 h-3 mr-1" /> Hadir
        </span>
      );
    }
    if (hasIzin) {
      return (
        <span className="badge-yellow">
          <AlertCircle className="w-3 h-3 mr-1" /> Izin
        </span>
      );
    }
    return <span className="badge-blue">{info[0].status}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmText={confirmState?.confirmText}
        cancelText="Batal"
        tone={confirmState?.tone}
        onCancel={() => setConfirmState(null)}
        onConfirm={async () => {
          const action = confirmState?.onConfirm;
          setConfirmState(null);
          if (action) await action();
        }}
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToDashboard}
                className="text-gray-600 hover:text-gray-900"
                title="Kembali ke dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  Logbook Harian
                </h1>
                <p className="text-sm text-gray-600">{user?.nama}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </div>
          {/* Tabs */}
          <div className="flex gap-4 mt-4 border-b">
            <button
              onClick={() => setActiveTab("today")}
              className={`pb-2 px-2 font-medium text-sm border-b-2 ${
                activeTab === "today"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Edit3 className="w-4 h-4 inline mr-1" />
              Hari Ini
            </button>
            <button
              onClick={() => {
                setActiveTab("history");
                if (history.length === 0) fetchHistory();
              }}
              className={`pb-2 px-2 font-medium text-sm border-b-2 ${
                activeTab === "history"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <History className="w-4 h-4 inline mr-1" />
              Riwayat
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {activeTab === "today" && (
          <>
            {/* Info absensi hari ini */}
            <div className="card mb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span className="font-semibold">
                    {formatDate(entry.tanggal)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Status Absen:</span>
                  {attendanceBadge()}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Status Logbook:</span>
                  <span
                    className={
                      STATUS_BADGE[entry.status]?.className || "badge-blue"
                    }
                  >
                    {STATUS_BADGE[entry.status]?.label || entry.status}
                  </span>
                </div>
              </div>
              {entry.absensi_info && entry.absensi_info.length > 0 && (
                <div className="mt-3 pt-3 border-t text-xs text-gray-600">
                  <p className="font-medium mb-1">Detail Absensi Hari Ini:</p>
                  <div className="flex flex-wrap gap-2">
                    {entry.absensi_info.map((a, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 rounded"
                      >
                        Sesi {a.sesi}: {a.status}
                        {a.jam_masuk && ` (${a.jam_masuk.slice(0, 5)})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Catatan reviewer (jika ditolak) */}
            {entry.status === "rejected" && entry.catatan_reviewer && (
              <div className="card mb-4 bg-red-50 border-red-200">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">
                      Ditolak oleh {entry.reviewed_by} pada{" "}
                      {new Date(entry.reviewed_at).toLocaleString("id-ID")}
                    </p>
                    <p className="text-sm text-red-800 mt-1">
                      <strong>Catatan:</strong> {entry.catatan_reviewer}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="card">
              {!isEditable && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Logbook berstatus{" "}
                  <strong>
                    {STATUS_BADGE[entry.status]?.label || entry.status}
                  </strong>{" "}
                  tidak bisa diedit.
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Judul Kegiatan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Contoh: Setup environment development React"
                    value={entry.judul}
                    onChange={(e) => handleFieldChange("judul", e.target.value)}
                    disabled={!isEditable}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kegiatan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="input-field"
                    rows="4"
                    placeholder="Deskripsikan kegiatan yang Anda lakukan..."
                    value={entry.kegiatan}
                    onChange={(e) =>
                      handleFieldChange("kegiatan", e.target.value)
                    }
                    disabled={!isEditable}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jam Mulai
                    </label>
                    <input
                      type="time"
                      className="input-field"
                      value={entry.jam_mulai || ""}
                      onChange={(e) =>
                        handleFieldChange("jam_mulai", e.target.value)
                      }
                      disabled={!isEditable}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jam Selesai
                    </label>
                    <input
                      type="time"
                      className="input-field"
                      value={entry.jam_selesai || ""}
                      onChange={(e) =>
                        handleFieldChange("jam_selesai", e.target.value)
                      }
                      disabled={!isEditable}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hasil / Output
                  </label>
                  <textarea
                    className="input-field"
                    rows="2"
                    placeholder="Hasil yang dicapai dari kegiatan ini (opsional)"
                    value={entry.hasil}
                    onChange={(e) => handleFieldChange("hasil", e.target.value)}
                    disabled={!isEditable}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kendala / Catatan
                  </label>
                  <textarea
                    className="input-field"
                    rows="2"
                    placeholder="Kendala yang dihadapi atau catatan tambahan (opsional)"
                    value={entry.kendala}
                    onChange={(e) =>
                      handleFieldChange("kendala", e.target.value)
                    }
                    disabled={!isEditable}
                  />
                </div>
              </div>

              {/* Action buttons */}
              {isEditable && (
                <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t">
                  <button
                    onClick={handleSaveDraft}
                    disabled={saving || submitting}
                    className="btn-secondary flex items-center"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Simpan Draft
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saving || submitting}
                    className="btn-primary flex items-center"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Submit untuk Review
                  </button>
                  {entry.id && entry.status === "draft" && (
                    <button
                      onClick={handleDelete}
                      className="btn-danger flex items-center ml-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus Draft
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "history" && (
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Riwayat Logbook</h2>
            {historyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Belum ada logbook sebelumnya
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold">{h.judul}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(h.tanggal)}
                          {h.jam_mulai && h.jam_selesai && (
                            <span className="ml-2">
                              <Clock className="w-3 h-3 inline" />{" "}
                              {h.jam_mulai.slice(0, 5)} -{" "}
                              {h.jam_selesai.slice(0, 5)}
                            </span>
                          )}
                        </p>
                      </div>
                      <span
                        className={
                          STATUS_BADGE[h.status]?.className || "badge-blue"
                        }
                      >
                        {STATUS_BADGE[h.status]?.label || h.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {h.kegiatan}
                    </p>
                    {h.status === "rejected" && h.catatan_reviewer && (
                      <p className="text-xs text-red-700 mt-2 bg-red-50 p-2 rounded">
                        <XCircle className="w-3 h-3 inline mr-1" />
                        <strong>Catatan reviewer:</strong>{" "}
                        {h.catatan_reviewer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogbookPage;
