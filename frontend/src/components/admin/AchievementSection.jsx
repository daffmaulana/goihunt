import { useEffect, useState } from 'react';
import { gameToast } from '../gameToast';
import { adminApi } from '../../api/axios.js';
import InlineEditableTable from './InlineEditableTable';

const COLUMNS = [
  { key: 'id',        label: 'ID',          readOnly: true                   },
  { key: 'code',      label: 'Kode',        readOnly: true                   },
  { key: 'icon',      label: 'Ikon',        type: 'image', readOnly: false    },
  { key: 'type',      label: 'Tipe',        readOnly: true                   },
  { key: 'target',    label: 'Target',      readOnly: false                   },
  { key: 'name',      label: 'Nama',        readOnly: false                  },
  { key: 'deskripsi', label: 'Deskripsi', readOnly: false                  },
];

const REQUIRED_FIELDS = ['icon','target','name', 'deskripsi'];

const AchievementSection = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        const res = await adminApi.get('/api/admin/achievements');
        setRows(res.data);
      } catch (err) {
        gameToast.error(err.response?.data?.message);
        setRows([]);
      }
    };

    fetchAchievements();
  }, []);

  const handleSave = async (id, updatedRow) => {
    try {
      const res = await adminApi.put(`/api/admin/achievements/${id}`, updatedRow);
      const saved = res.data?.data ?? updatedRow;
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, ...saved } : row))
      );
      gameToast.success(res.data?.message);
    } catch (err) {
      gameToast.error(err.response?.data?.message);
    }
  };

  return (
    <div>
      <InlineEditableTable
        columns={COLUMNS}
        rows={rows}
        onSave={handleSave}
        addRow={false}
        requiredFields={REQUIRED_FIELDS}
      />
    </div>
  );
};

export default AchievementSection;