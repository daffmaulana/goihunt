import { useEffect, useState } from 'react';
import { gameToast } from '../gameToast';
import { adminApi } from '../../api/axios.js';
import InlineEditableTable from './InlineEditableTable';
import ConfirmDialog from './ConfirmDialog';

const REQUIRED_FIELDS = [
  'vocab_id',
  'question',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct_answer',
];

const QuizSection = () => {
  const [rows, setRows]       = useState([]);
  const [vocabs, setVocabs]   = useState([]);

  const [confirmShow, setConfirmShow]         = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [quizRes, vocabRes] = await Promise.all([
          adminApi.get('/api/admin/quiz'),
          adminApi.get('/api/admin/vocab'),
        ]);
        setRows(quizRes.data.data ?? quizRes.data);
        setVocabs(vocabRes.data);
      } catch (err) {
        gameToast.error(err.response?.data?.message);
        setRows([]);
      }
    };

    fetchData();
  }, []);

  const columns = [
    { key: 'id', label: 'ID', readOnly: true },
    {
      key: 'vocab_id',
      label: 'Vocab ID',
      type: 'select',
      options: vocabs.map((v) => ({
        value: v.id,
        label: `${v.id} - ${v.label}`,
      })),
    },
    { key: 'question', label: 'Pertanyaan'},
    { key: 'option_a',       label: 'Opsi A'},
    { key: 'option_b', label: 'Opsi B'       },
    { key: 'option_c',label: 'Opsi C'       },
    { key: 'option_d', label: 'Opsi D'       },
    { key: 'correct_answer', label: 'Opsi Benar' },
  ];

  const handleSave = async (id, updatedRow) => {
    try {
      const res = await adminApi.put(`/api/admin/quiz/${id}`, updatedRow);
      const saved = res.data.data ?? updatedRow;
      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, ...saved } : row))
      );
      gameToast.success(res.data.message);
    } catch (err) {
      gameToast.error(err.response?.data?.message);
    }
  };

  const handleAdd = async (newRow) => {
    try {
      const res = await adminApi.post('/api/admin/quiz', newRow);
      const created = res.data.data ?? newRow;
      setRows((prev) => [...prev, created]);
      gameToast.success(res.data.message);
    } catch (err) {
      gameToast.error(err.response?.data?.message);
    }
  };

  const handleDeleteRequest = (id) => {
    setPendingDeleteId(id);
    setConfirmShow(true);
  };

  const handleDeleteConfirm = async () => {
    setConfirmShow(false);
    const id = pendingDeleteId;
    setPendingDeleteId(null);

    try {
      const res = await adminApi.delete(`/api/admin/quiz/${id}`);
      setRows((prev) => prev.filter((row) => row.id !== id));
      gameToast.success(res.data.message);
    } catch (err) {
      gameToast.error(err.response?.data?.message);
    }
  };

  const handleDeleteCancel = () => {
    setConfirmShow(false);
    setPendingDeleteId(null);
  };

  return (
    <>
      <InlineEditableTable
        columns={columns}
        rows={rows}
        onSave={handleSave}
        onDelete={handleDeleteRequest}
        addRow={true}
        onAdd={handleAdd}
        requiredFields={REQUIRED_FIELDS}
      />

      <ConfirmDialog
        show={confirmShow}
        message="Ingin hapus entri kuis ini?"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
};

export default QuizSection;
