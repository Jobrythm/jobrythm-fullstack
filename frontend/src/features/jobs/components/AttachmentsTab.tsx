import { IconDownload, IconFile, IconPhoto, IconTrash, IconUpload } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { EmptyState } from '../../../components/EmptyState';
import { getAttachmentDownloadUrl } from '../../../api/attachments';
import { useAttachments, useDeleteAttachment, useUploadAttachment } from '../hooks/useAttachments';

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImage = (mimeType: string) => mimeType.startsWith('image/');

interface Props {
  jobId: string;
}

export const AttachmentsTab = ({ jobId }: Props) => {
  const { data: attachments = [], isLoading } = useAttachments(jobId);
  const upload = useUploadAttachment(jobId);
  const deleteAttachment = useDeleteAttachment(jobId);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      upload.mutate({ file });
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  if (isLoading) {
    return (
      <div className="col-12">
        <div className="card">
          <div className="card-body text-muted">Loading attachments…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="col-12">
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h3 className="card-title mb-0">
            Files &amp; Photos
            {attachments.length > 0 && (
              <span className="ms-2 text-muted fw-normal fs-5">— {attachments.length} file{attachments.length !== 1 ? 's' : ''}</span>
            )}
          </h3>
          <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}>
            <IconUpload size={14} className="me-1" />
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
            className="d-none"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* Drop zone */}
        <div
          className={`card-body border-bottom py-3 text-center ${dragOver ? 'bg-primary-lt' : 'bg-light'}`}
          style={{ cursor: 'pointer', transition: 'background 0.15s' }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <IconUpload size={20} className="text-muted me-2" />
          <span className="text-muted">
            {upload.isPending ? 'Uploading…' : 'Drop files here or click to upload'}
          </span>
          <div className="text-muted small mt-1">Images, PDF, Word, Excel — max 25MB each</div>
        </div>

        {attachments.length === 0 ? (
          <div className="card-body">
            <EmptyState
              icon={<IconPhoto size={40} className="text-muted" />}
              title="No attachments yet"
              description="Upload photos, PDFs, or documents related to this job."
            />
          </div>
        ) : (
          <div className="row g-3 p-3">
            {attachments.map((att) => (
              <div key={att.id} className="col-sm-6 col-md-4 col-lg-3">
                <div className="card card-sm h-100">
                  {isImage(att.mimeType) ? (
                    <a
                      href={getAttachmentDownloadUrl(att.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="d-block"
                    >
                      <img
                        src={getAttachmentDownloadUrl(att.id)}
                        alt={att.originalName}
                        className="card-img-top object-fit-cover"
                        style={{ height: 120 }}
                      />
                    </a>
                  ) : (
                    <div
                      className="d-flex align-items-center justify-content-center bg-light"
                      style={{ height: 120 }}
                    >
                      <IconFile size={40} className="text-muted" />
                    </div>
                  )}
                  <div className="card-body p-2">
                    <div className="text-truncate fw-medium small" title={att.originalName}>
                      {att.originalName}
                    </div>
                    <div className="text-muted small">{formatBytes(att.size)}</div>
                    <div className="mt-2 d-flex gap-1">
                      <a
                        href={getAttachmentDownloadUrl(att.id)}
                        className="btn btn-ghost-secondary btn-sm btn-icon"
                        download={att.originalName}
                        title="Download"
                      >
                        <IconDownload size={14} />
                      </a>
                      <button
                        className="btn btn-ghost-danger btn-sm btn-icon"
                        onClick={() => setDeleteId(att.id)}
                        title="Delete"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteId}
        title="Delete attachment?"
        body="The file will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) deleteAttachment.mutate(deleteId, { onSuccess: () => setDeleteId(null) });
        }}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};
