import { useEffect, useState } from 'react';
import { gameToast } from '../gameToast';
import { adminApi } from '../../api/axios.js';
import InlineEditableTable from './InlineEditableTable';

const COLUMNS = [
  { key: 'id',                 label: 'ID',                 readOnly: true  },
  { key: 'label',              label: 'Label',              readOnly: true },
  { key: 'image_url',          label: 'Gambar',          type: 'image', readOnly: false },
  { key: 'kanji',              label: 'Kanji',              readOnly: false },
  { key: 'furigana',           label: 'Furigana',           readOnly: false },
  { key: 'romaji',             label: 'Romaji',             readOnly: false },
  { key: 'definition',         label: 'Definisi',         readOnly: false },
  { key: 'example_id',         label: 'Contoh ID',         readOnly: false },
  { key: 'example_romaji',     label: 'Contoh Romaji',     readOnly: false },
  { key: 'example_furigana',   label: 'Contoh Furigana',   readOnly: false },
];

const REQUIRED_FIELDS = ['label', 'image_url', 'kanji', 'romaji', 'definition', 'example_id', 'example_romaji', 'example_furigana'];

const VocabSection = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchVocab = async () => {
      try {
        const res = await adminApi.get('/admin/vocab');
        setRows(res.data);
      } catch (err) {
        gameToast.error(err.response?.data?.message);
        setRows([]);
      }
    };

    fetchVocab();
  }, []);

  const handleSave = async (id, updatedRow) => {
    try {
      const res = await adminApi.put(`/admin/vocab/${id}`, updatedRow);
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

export default VocabSection;
