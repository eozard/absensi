/*
 * Admin Logbook Dashboard
 *
 * Halaman admin untuk mereview logbook harian mahasiswa.
 * Fitur:
 * - Stats kartu: total, hari ini, pending, approved, rejected
 * - Filter by nama, kelompok, tanggal, status
 * - Klik entry -> modal detail + tombol approve/reject + catatan
 */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  BookOpen,
  Loader2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Eye,
  User,
} from "lucide-react";
import axiosInstance from "../utils/axios";
import ToastStack from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../hooks/useToast";

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Menunggu Review" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

const STATUS_BADGE = {
  draft: { label: "Draft", className: "badge-blue" },
  submitted: { label: "Menunggu Review", className: "badge-yellow" },
  approved: { label: "Disetujui", className: "badge-green" },
  rejected: { label: "Ditolak", className: "badge-red" },
};

const kelompokOptions = [
  "all",
  "machine learning",
  "software engineering",
  "jaringan",
  "desain komunikasi visual",
];

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const AdminLogbookPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [confirmState, setConfirmState] = useState(null);
  const { toasts, pushToast, dismissToast } = useToast();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    nama: "all",
    kelompok: "all",
    status: "all",
    fromDate: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) {
      navigate("/");
      return;
    }
    setUser(storedUser);
    fetchInitial();
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [filters]);

  const fetchInitial = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchStats(), fetchStudents()]);
      await fetchEntries();
    } catch (error) {
      console.error("Init error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axiosInstance.get("/admin/logbook/stats");
      if (res.data.success) setStats(res.data.stats);
    } catch (error) {
      console.error("Fetch stats error:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await axiosInstance.get("/admin/students");
      if (res.data.success) setStudents(res.data.students || []);
    } catch (error) {
      console.error("Fetch students error:", error);
    }
  };

  const fetchEntries = async () => {
    try {
      const params = {};
      if (filters.nama !== "all") params.nama = filters.nama;
      if (filters.kelompok !== "all") params.kelompok = filters.kelompok;
      if (filters.status !== "all") params.status = filters.status;
      if (filters.fromDate) params.fromDate = filters.fromDate;
      if (filters.toDate) params.toDate = filters.toDate;

      const res = await axiosInstance.get("/admin/logbook", { params });
      if (res.data.success) setEntries(res.data.data || []);
    } catch (error) {
      pushToast({
        type: "error",
        title: "Gagal memuat data",
        message: error.response?.data?.message || "Server error",
      });
    }
  };

  const openDetail = async (id) => {
    setDetailLoading(true);
    setSelectedEntry({ loading: true });
    try {
      const res = await axiosInstance.get(`/admin/logbook/${id}`);
      if (res.data.success) {
        setSelectedEntry(res.data.data);
        setReviewNote("");
      }
    } catch (error) {
      pushToast({
        type: "error",
        title: "Gagal memuat detail",
        message: error.response?.data?.message || "Server error",
      });
      setSelectedEntry(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedEntry(null);
    setReviewNote("");
  };

  const handleReview = (status) => {
    if (!selectedEntry) return;
    if (status === "rejected" && !reviewNote.trim()) {
      pushToast({
        type: "warning",
        title: "Catatan wajib",
        message: "Berikan catatan untuk alasan penolakan",
      });
      return;
    }
    setConfirmState({
      title: status === "approved" ? "Setujui Logbook?" : "Tolak Logbook?",
      message:
        status === "approved"
          ? "Mahasiswa akan menerima notifikasi bahwa logbook disetujui."
          : `Logbook akan dikembalikan ke mahasiswa dengan catatan: "${reviewNote}"`,
      confirmText: status === "approved" ? "Setujui" : "Tolak",
      tone: status === "approved" ? "primary" : "danger",
      onConfirm: async () => {
        setReviewing(true);
        try {
          const res = await axiosInstance.put(
            `/admin/logbook/${selectedEntry.id}/review`,
            {
              status,
              catatan_reviewer: reviewNote || null,
            },
          );
          if (res.data.success) {
            pushToast({
              type: "success",
              title: "Berhasil",
              message: res.data.message,
            });
            closeDetail();
            await Promise.all([fetchEntries(), fetchStats()]);
          }
        } catch (error) {
          pushToast({
            type: "error",
            title: "Gagal",
            message: error.response?.data?.message || "Server error",
          });
        } finally {
          setReviewing(false);
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

  const handleBackToAdmin = () => {
    navigate("/admin");
  };

  const filteredStudents =
    filters.kelompok === "all"
      ? students
      : students.filter((s) => s.kelompok === filters.kelompok);

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
                onClick={handleBackToAdmin}
                className="text-gray-600 hover:text-gray-900"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                  Review Logbook
                </h1>
                <p className="text-sm text-gray-600">Admin: {user?.nama}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-secondary flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <p className="text-sm text-gray-600">Hari Ini</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.todayEntries}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Menunggu Review</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Disetujui</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.approved}
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-600">Ditolak</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="card mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold">Filter</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Kelompok</label>
              <select
                className="input-field"
                value={filters.kelompok}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    kelompok: e.target.value,
                    nama: "all",
                  }))
                }
              >
                {kelompokOptions.map((k) => (
                  <option key={k} value={k}>
                    {k === "all" ? "Semua Kelompok" : k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Mahasiswa</label>
              <select
                className="input-field"
                value={filters.nama}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, nama: e.target.value }))
                }
              >
                <option value="all">Semua Mahasiswa</option>
                {filteredStudents.map((s) => (
                  <option key={s.nama} value={s.nama}>
                    {s.nama}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Status</label>
              <select
                className="input-field"
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value }))
                }
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Dari</label>
              <input
                type="date"
                className="input-field"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, fromDate: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Sampai</label>
              <input
                type="date"
                className="input-field"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, toDate: e.target.value }))
                }
              />
            </div>
          </div>
        </div>

        {/* List entries */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">
            Daftar Logbook ({entries.length})
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : entries.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Tidak ada logbook sesuai filter
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Mahasiswa
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Judul
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        {new Date(e.tanggal).toLocaleDateString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{e.nama}</div>
                        <div className="text-xs text-gray-500">
                          {e.kelompok}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium line-clamp-1">
                          {e.judul}
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-1">
                          {e.kegiatan}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            STATUS_BADGE[e.status]?.className || "badge-blue"
                          }
                        >
                          {STATUS_BADGE[e.status]?.label || e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDetail(e.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" /> Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEntry && !selectedEntry.loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
              <h3 className="text-xl font-bold">Detail Logbook</h3>
              <button
                onClick={closeDetail}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-xs text-gray-500">Mahasiswa</p>
                  <p className="font-semibold flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedEntry.nama}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedEntry.kelompok}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tanggal</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {formatDate(selectedEntry.tanggal)}
                  </p>
                  {selectedEntry.jam_mulai && selectedEntry.jam_selesai && (
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedEntry.jam_mulai.slice(0, 5)} -{" "}
                      {selectedEntry.jam_selesai.slice(0, 5)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span
                  className={
                    STATUS_BADGE[selectedEntry.status]?.className ||
                    "badge-blue"
                  }
                >
                  {STATUS_BADGE[selectedEntry.status]?.label ||
                    selectedEntry.status}
                </span>
              </div>

              {selectedEntry.absensi_info &&
                selectedEntry.absensi_info.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-xs font-semibold text-blue-900 mb-2">
                      Absensi Tanggal Ini:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.absensi_info.map((a, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-white rounded"
                        >
                          {a.sesi}: {a.status}
                          {a.jam_masuk && ` (${a.jam_masuk.slice(0, 5)})`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              <div>
                <p className="text-xs text-gray-500 mb-1">Judul</p>
                <p className="font-semibold">{selectedEntry.judul}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Kegiatan</p>
                <p className="text-sm whitespace-pre-wrap">
                  {selectedEntry.kegiatan}
                </p>
              </div>

              {selectedEntry.hasil && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Hasil</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedEntry.hasil}
                  </p>
                </div>
              )}

              {selectedEntry.kendala && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Kendala</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedEntry.kendala}
                  </p>
                </div>
              )}

              {selectedEntry.status === "rejected" &&
                selectedEntry.catatan_reviewer && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-xs font-semibold text-red-900">
                      Catatan Reviewer ({selectedEntry.reviewed_by}):
                    </p>
                    <p className="text-sm text-red-800 mt-1">
                      {selectedEntry.catatan_reviewer}
                    </p>
                  </div>
                )}

              {selectedEntry.status === "approved" &&
                selectedEntry.reviewed_by && (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-xs font-semibold text-green-900">
                      Disetujui oleh {selectedEntry.reviewed_by} pada{" "}
                      {new Date(selectedEntry.reviewed_at).toLocaleString(
                        "id-ID",
                      )}
                    </p>
                    {selectedEntry.catatan_reviewer && (
                      <p className="text-sm text-green-800 mt-1">
                        {selectedEntry.catatan_reviewer}
                      </p>
                    )}
                  </div>
                )}

              {/* Review form - hanya untuk status submitted */}
              {selectedEntry.status === "submitted" && (
                <div className="border-t pt-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan Review (wajib jika ditolak)
                  </label>
                  <textarea
                    className="input-field"
                    rows="3"
                    placeholder="Berikan catatan atau masukkan untuk mahasiswa..."
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                  />
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => handleReview("approved")}
                      disabled={reviewing}
                      className="btn-success flex-1 flex items-center justify-center"
                    >
                      {reviewing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Setujui
                    </button>
                    <button
                      onClick={() => handleReview("rejected")}
                      disabled={reviewing}
                      className="btn-danger flex-1 flex items-center justify-center"
                    >
                      {reviewing ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-2" />
                      )}
                      Tolak
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {detailLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}
    </div>
  );
};

export default AdminLogbookPage;
