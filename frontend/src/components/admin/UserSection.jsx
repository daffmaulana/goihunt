import { useEffect, useState } from 'react';
import { gameToast } from '../gameToast';
import { adminApi } from '../../api/axios.js';
import InlineEditableTable from './InlineEditableTable';
import ConfirmDialog from './ConfirmDialog';

const COLUMNS = [
  { key: 'id',             label: 'ID',             readOnly: true },
  { key: 'username',       label: 'Username',       readOnly: true },
  { key: 'email',          label: 'Email',          readOnly: true },
  { key: 'password',       label: 'Password',       readOnly: true },
  { key: 'created_at',     label: 'Created At',     readOnly: true },
  { key: 'avatar_key',     label: 'Avatar',         type: 'image', readOnly: true },
  { key: 'xp',             label: 'XP',             readOnly: true },
  { key: 'level',          label: 'Level',          readOnly: true },
  { key: 'total_classify', label: 'Total Klasifikasi', readOnly: true },
  { key: 'total_quiz',     label: 'Total Kuis',     readOnly: true },
  { key: 'total_mission',  label: 'Total Misi',  readOnly: true },
  { key: 'total_vocab',    label: 'Total Vocab',    readOnly: true },
  { key: 'xp_timestamp',   label: 'XP Timestamp',  readOnly: true },
];

const UserSection = () => {
  const [rows, setRows] = useState([]);

  const [confirmShow, setConfirmShow]         = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await adminApi.get('/api/admin/users');
        setRows(res.data.data ?? res.data);
      } catch (err) {
        gameToast.error(err.response?.data?.message);
        setRows([]);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteRequest = (id) => {
    setPendingDeleteId(id);
    setConfirmShow(true);
  };

  const handleDeleteConfirm = async () => {
    setConfirmShow(false);
    const id = pendingDeleteId;
    setPendingDeleteId(null);

    try {
      const res = await adminApi.delete(`/api/admin/users/${id}`);
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
        columns={COLUMNS}
        rows={rows}
        onDelete={handleDeleteRequest}
        addRow={false}
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

export default UserSection;
