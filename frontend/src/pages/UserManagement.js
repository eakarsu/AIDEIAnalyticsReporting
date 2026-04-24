import React, { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:3001/api';

const emptyForm = { email: '', name: '', password: '', role: 'analyst' };

function UserManagement({ token }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ ...emptyForm });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/users/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (usersRes.status === 403) {
        setError('Admin access required to manage users');
        setLoading(false);
        return;
      }

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      setUsers(Array.isArray(usersData) ? usersData : []);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load users');
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API}/users`, {
        method: 'POST', headers,
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setShowCreateModal(false);
      setFormData({ ...emptyForm });
      setSuccess('User created successfully');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to create user');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const body = { ...formData };
      if (!body.password) delete body.password;
      const res = await fetch(`${API}/users/${selectedUser.id}`, {
        method: 'PUT', headers,
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setShowEditModal(false);
      setSelectedUser(null);
      setSuccess('User updated successfully');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update user');
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess('User deleted');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const openEdit = (user) => {
    setSelectedUser(user);
    setFormData({ email: user.email, name: user.name, password: '', role: user.role });
    setShowEditModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getRoleBadge = (role) => {
    const cls = { admin: 'badge-danger', analyst: 'badge-info', manager: 'badge-warning' };
    return <span className={cls[role] || 'badge-neutral'}>{role}</span>;
  };

  const renderFormModal = (isEdit) => (
    <div className="modal-overlay" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit User' : 'Create New User'}</h3>
          <button className="modal-close" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>&times;</button>
        </div>
        <div className="modal-body">
          <form onSubmit={isEdit ? handleEdit : handleCreate}>
            <div className="form-grid">
              <div className="form-group">
                <label>Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleFormChange} required placeholder="Full name" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleFormChange} required placeholder="user@company.com" />
              </div>
              <div className="form-group">
                <label>{isEdit ? 'New Password (leave blank to keep)' : 'Password'}</label>
                <input type="password" name="password" value={formData.password} onChange={handleFormChange}
                  required={!isEdit} placeholder={isEdit ? 'Leave blank to keep current' : 'Password'} />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select name="role" value={formData.role} onChange={handleFormChange}>
                  <option value="analyst">Analyst</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={() => isEdit ? setShowEditModal(false) : setShowCreateModal(false)}>Cancel</button>
              <button type="submit" className="btn-primary">{isEdit ? 'Update User' : 'Create User'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (error === 'Admin access required to manage users') {
    return (
      <div>
        <div className="page-header"><div><h2>User Management</h2><p>Admin access required</p></div></div>
        <div className="data-table-container" style={{ padding: '40px', textAlign: 'center' }}>
          <h3 style={{ color: '#f87171', marginBottom: '8px' }}>Access Denied</h3>
          <p style={{ color: '#94a3b8' }}>Only administrators can manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>User Management</h2>
          <p>Manage user accounts and permissions</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => { setFormData({ ...emptyForm }); setError(null); setShowCreateModal(true); }}>
            + New User
          </button>
        </div>
      </div>

      {success && (
        <div style={{
          padding: '14px 20px', borderRadius: '12px', marginBottom: '24px',
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
          color: '#34d399', fontSize: '14px'
        }}>{success}</div>
      )}
      {error && error !== 'Admin access required to manage users' && (
        <div style={{
          padding: '14px 20px', borderRadius: '12px', marginBottom: '24px',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', fontSize: '14px'
        }}>{error}</div>
      )}

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-number">{stats?.total || 0}</div>
          <div className="stat-text">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.recentSignups || 0}</div>
          <div className="stat-text">New (30 days)</div>
        </div>
        {stats?.byRole?.map(r => (
          <div className="stat-card" key={r.role}>
            <div className="stat-number">{r.count}</div>
            <div className="stat-text" style={{ textTransform: 'capitalize' }}>{r.role}s</div>
          </div>
        ))}
      </div>

      <div className="data-table-container">
        {loading ? (
          <p style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>Loading users...</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} style={{ cursor: 'default' }}>
                  <td>{user.id}</td>
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td style={{ fontSize: '13px', color: '#94a3b8' }}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-edit" onClick={() => openEdit(user)} style={{ padding: '4px 12px', fontSize: '12px' }}>Edit</button>
                      <button className="btn-danger" onClick={() => handleDelete(user)} style={{ padding: '4px 12px', fontSize: '12px' }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreateModal && renderFormModal(false)}
      {showEditModal && renderFormModal(true)}
    </div>
  );
}

export default UserManagement;
