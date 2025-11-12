import Swal from "sweetalert2";

export const showSuccess = (title = "Berhasil!", text = "") => {
  return Swal.fire({
    icon: "success",
    title,
    text,
    timer: 2000,
    showConfirmButton: false,
  });
};

export const showError = (title = "Gagal!", text = "Terjadi kesalahan.") => {
  return Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "Tutup",
  });
};

export const showLoading = (text = "Memproses...") => {
  Swal.fire({
    title: text,
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

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

export const showAuthSuccess = (type = "login") => {
  const text =
    type === "login"
      ? "Login berhasil! Selamat datang kembali 👋"
      : "Registrasi berhasil! Silakan login untuk melanjutkan.";
  return showSuccess("Sukses!", text);
};

export const showSaveSuccess = (isEdit = false) => {
  const text = isEdit ? "Data berhasil diperbarui!" : "Data berhasil disimpan!";
  return showSuccess("Berhasil!", text);
};

export const showDeleteSuccess = () => {
  return showSuccess("Terhapus!", "Data berhasil dihapus.");
};

export const handleApiError = (error, fallbackTitle = "Terjadi Kesalahan") => {
  console.error(error);

  const errMsg =
    error.response?.data?.msg ||
    error.response?.data?.message ||
    "Terjadi kesalahan pada server.";

  Swal.close();
  return showError(fallbackTitle, errMsg);
};
