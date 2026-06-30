import { useState, useEffect } from 'react';
import { gameToast } from '../gameToast';

const InlineEditableTable = ({
  columns = [],
  rows = [],
  onSave,
  onDelete,
  addRow = false,
  onAdd,
  requiredFields = [],
}) => {
  const [editState, setEditState] = useState({});
  const [templateRow, setTemplateRow] = useState({});

  useEffect(() => {
    const initial = {};
    rows.forEach((row) => {
      if (!editState[row.id]) {
        initial[row.id] = { ...row };
      }
    });
    setEditState((prev) => ({ ...initial, ...prev }));
  }, [rows]);

  useEffect(() => {
    const blank = {};
    columns.forEach((col) => {
      if (!col.readOnly) blank[col.key] = '';
    });
    setTemplateRow(blank);
  }, [columns]);

  const handleFieldChange = (rowId, key, value) => {
    setEditState((prev) => ({
      ...prev,
      [rowId]: { ...prev[rowId], [key]: value },
    }));
  };

  const handleTemplateChange = (key, value) => {
    setTemplateRow((prev) => ({ ...prev, [key]: value }));
  };

  const validateRequired = (data) => {
    const missing = requiredFields.filter(
      (key) => data[key] === undefined || String(data[key]).trim() === ''
    );
    if (missing.length > 0) {
      const missingLabels = missing.map((key) => {
        const col = columns.find((c) => c.key === key);
        return col ? col.label : key;
      });
      gameToast.error(`Kolom masih kosong: ${missingLabels.join(', ')}`);
    }
    return missing;
  };

  const handleSave = (rowId) => {
    const data = editState[rowId] || {};
    const missing = validateRequired(data);
    if (missing.length > 0) return;

    const updatedRow = {};
    columns.forEach((col) => {
      updatedRow[col.key] = data[col.key];
    });

    if (onSave) onSave(rowId, updatedRow);
  };

  const handleAdd = () => {
    const missing = validateRequired(templateRow);
    if (missing.length > 0) return;

    if (onAdd) {
      onAdd({ ...templateRow });
      const blank = {};
      columns.forEach((col) => {
        if (!col.readOnly) blank[col.key] = '';
      });
      setTemplateRow(blank);
    }
  };

  return (
    <div className="table-responsive">
      <table className="table table-bordered table-hover align-middle">
        <thead className="table-dark">
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {col.label}
              </th>
            ))}
            <th scope="col">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const rowData = editState[row.id] || row;
            return (
              <tr key={row.id}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.readOnly ? (
                      col.type === 'image' && row[col.key]
                        ? <div className="d-flex flex-column gap-1">
                            <img src={row[col.key]} alt={col.label} style={{ height: 40, width: 40, objectFit: 'cover', borderRadius: 4 }} />
                            <span className="small text-muted">{row[col.key]}</span>
                          </div>
                        : <span>{row[col.key]}</span>
                    ) : col.type === 'select' ? (
                      <select
                        className="form-select form-select-sm"
                        value={rowData[col.key] ?? ''}
                        onChange={(e) =>
                          handleFieldChange(row.id, col.key, e.target.value)
                        }
                        aria-label={col.label}
                      >
                        <option value="">— select —</option>
                        {col.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : col.type === 'image' ? (
                      <div className="d-flex flex-column gap-1">
                        {rowData[col.key] && (
                          <img
                            src={rowData[col.key]}
                            alt="preview"
                            style={{ height: 48, width: 48, objectFit: 'cover', borderRadius: 4, border: '1px solid #dee2e6' }}
                          />
                        )}
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={rowData[col.key] ?? ''}
                          onChange={(e) =>
                            handleFieldChange(row.id, col.key, e.target.value)
                          }
                          aria-label={col.label}
                        />
                      </div>
                    ) : (
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={rowData[col.key] ?? ''}
                        onChange={(e) =>
                          handleFieldChange(row.id, col.key, e.target.value)
                        }
                        aria-label={col.label}
                      />
                    )}
                  </td>
                ))}
                <td>
                  <div className="d-flex gap-2">
                    {onSave && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSave(row.id)}
                      >
                        Simpan
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => onDelete(row.id)}
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}

          {addRow && (
            <tr className="table-secondary">
              {columns.map((col) => (
                <td key={col.key}>
                  {col.readOnly ? (
                    <span className="text-muted">—</span>
                  ) : col.type === 'select' ? (
                    <select
                      className="form-select form-select-sm"
                      value={templateRow[col.key] ?? ''}
                      onChange={(e) =>
                        handleTemplateChange(col.key, e.target.value)
                      }
                      aria-label={`New ${col.label}`}
                    >
                      <option value="">— pilih —</option>
                      {col.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : col.type === 'image' ? (
                    <div className="d-flex flex-column gap-1">
                      {templateRow[col.key] && (
                        <img
                          src={templateRow[col.key]}
                          alt="preview"
                          style={{ height: 48, width: 48, objectFit: 'cover', borderRadius: 4, border: '1px solid #dee2e6' }}
                        />
                      )}
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={templateRow[col.key] ?? ''}
                        onChange={(e) =>
                          handleTemplateChange(col.key, e.target.value)
                        }
                        placeholder={col.label}
                        aria-label={`New ${col.label}`}
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={templateRow[col.key] ?? ''}
                      onChange={(e) =>
                        handleTemplateChange(col.key, e.target.value)
                      }
                      placeholder={col.label}
                      aria-label={`New ${col.label}`}
                    />
                  )}
                </td>
              ))}
              <td>
                <button
                  type="button"
                  className="btn btn-success btn-sm"
                  onClick={handleAdd}
                >
                  Tambah
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InlineEditableTable;
