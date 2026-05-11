type CameraPreviewProps = {
  title: string;
  status?: string;
};

export function CameraPreview({ title, status = "LIVE" }: CameraPreviewProps) {
  return (
    <div className="cameraPreview">
      <div className="cameraPreviewTop">
        <span>{title}</span>
        <strong>{status}</strong>
      </div>
      <div className="cameraScene">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
