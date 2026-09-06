import { useState } from "react";
import { API_URL } from "../services/config";
import { authService } from "../services/authService";

export default function ImageUploadField({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.append("imagen", file); // debe llamarse "imagen" → coincide con upload.single("imagen")

    try {
      const res = await fetch(`${API_URL}/upload/imagen`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authService.getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Error al subir imagen");
      onChange(data.url);
    } catch (err) {
      setError("No se pudo subir la imagen. Intenta de nuevo.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {value && (
        <img src={value} alt="Vista previa"
          style={{ width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "12px", marginBottom: "10px" }} />
      )}
      <input type="file" accept="image/*" onChange={handleFile} disabled={uploading}
        className="queja-mesa-input" style={{ padding: "10px" }} />
      {uploading && <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginTop: "6px" }}>Subiendo imagen...</p>}
      {error && <p style={{ fontSize: "13px", color: "#ef4444", marginTop: "6px" }}>{error}</p>}
    </div>
  );
}