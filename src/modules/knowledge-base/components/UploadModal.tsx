import { useState, useRef, type DragEvent } from "react";
import { Upload, X, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (file: File, category: string) => Promise<void>;
}

export function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>("Soporte Técnico");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (
      !allowedTypes.includes(file.type) &&
      !file.name.endsWith(".pdf") &&
      !file.name.endsWith(".docx")
    ) {
      setError("Solo se permiten archivos PDF, DOCX o TXT.");
      return false;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError("El archivo excede el tamaño máximo permitido de 25MB.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError("Selecciona un archivo antes de continuar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onUploadSuccess(selectedFile, category);
      setSelectedFile(null);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir e indexar el documento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload className="size-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">Subir Documento o Manual</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Departamento / Área
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="Soporte Técnico">Soporte Técnico</option>
              <option value="Cartera & Cobros">Cartera & Cobros</option>
              <option value="UTGA & Operaciones">UTGA & Operaciones</option>
              <option value="Políticas Generales">Políticas Generales</option>
            </select>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-primary bg-primary/10"
                : selectedFile
                  ? "border-emerald-500/50 bg-emerald-500/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/20"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt"
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="size-10 text-emerald-400" />
                <p className="text-sm font-semibold text-foreground">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <p className="text-xs text-primary font-medium mt-1">
                  Haz clic o arrastra para cambiar archivo
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileText className="size-10 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">
                  Arrastra tu archivo aquí o{" "}
                  <span className="text-primary hover:underline">examina</span>
                </p>
                <p className="text-xs text-muted-foreground">Soporta PDF, DOCX y TXT (Máx. 25MB)</p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted/20 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Vectorizando...
                </>
              ) : (
                "Subir e Indexar en RAG"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
