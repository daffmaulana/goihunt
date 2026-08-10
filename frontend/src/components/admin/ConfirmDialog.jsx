const ConfirmDialog = ({ show, message, onConfirm, onCancel }) => {
  return (
    <>
      {/* Modal */}
      <div
        className={`modal fade${show ? ' show' : ''}`}
        style={{ display: show ? 'block' : 'none' }}
        tabIndex="-1"
        role="dialog"
        aria-modal={show ? 'true' : undefined}
        aria-hidden={!show}
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Konfirmasi Hapus</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onCancel}
              />
            </div>
            <div className="modal-body">
              <p>{message}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onCancel}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={onConfirm}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      </div>

      {show && (
        <div
          className="modal-backdrop fade show"
          onClick={onCancel}
        />
      )}
    </>
  );
};

export default ConfirmDialog;