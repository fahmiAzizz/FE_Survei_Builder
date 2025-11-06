import Swal from "sweetalert2";

// ✅ Base Success Alert
export const showSuccess = (title = "Berhasil!", text = "") => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    timer: 2000,
    showConfirmButton: false,
  });
};

// ⚠️ Base Error Alert
export const showError = (title = "Gagal!", text = "Terjadi kesalahan.") => {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "Tutup",
  });
};

// ⚙️ Loading Alert (misalnya saat login, register, dll)
export const showLoading = (text = "Memproses...") => {
  Swal.fire({
    title: text,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

// 📝 Alert Konfirmasi (untuk hapus data, logout, dll)
export const showConfirm = async (
  title = "Apakah kamu yakin?",
  text = "Tindakan ini tidak bisa dibatalkan.",
  confirmText = "Ya, hapus",
  cancelText = "Batal"
) => {
  const result = await Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
  return result.isConfirmed;
};

// 🎯 Alert Khusus Login/Register
export const showAuthSuccess = (type = "login") => {
  const text =
    type === "login"
      ? "Login berhasil! Selamat datang kembali 👋"
      : "Registrasi berhasil! Silakan login untuk melanjutkan.";
  return showSuccess("Sukses!", text);
};

// 📦 Alert untuk Input/Edit Data
export const showSaveSuccess = (isEdit = false) => {
  const text = isEdit ? "Data berhasil diperbarui!" : "Data berhasil disimpan!";
  return showSuccess("Berhasil!", text);
};

// 🗑️ Alert untuk Hapus Data
export const showDeleteSuccess = () => {
  return showSuccess("Terhapus!", "Data berhasil dihapus.");
};

export const handleApiError = (error, fallbackTitle = "Terjadi Kesalahan") => {
  console.error(error);

  // Ambil pesan error dari berbagai kemungkinan format
  const errMsg =
    error.response?.data?.msg || // backend kamu pakai "msg"
    error.response?.data?.message || // kalau backend pakai "message"
    error.message ||
    "Terjadi kesalahan pada server.";

  Swal.close();
  return showError(fallbackTitle, errMsg);
};
