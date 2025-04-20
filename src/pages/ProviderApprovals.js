import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from 'firebase/firestore';

function ProviderApprovals() {
  const [providers, setProviders] = useState([]);
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(false);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'consultants'),
        where('approvalStatus', '==', 'pending')
      );
      const qs = await getDocs(q);
      const data = [];
      qs.forEach(snap => data.push({ id: snap.id, ...snap.data() }));
      setProviders(data);

      setRates(prev =>
        data.reduce((map, p) => ({ ...map, [p.id]: prev[p.id] ?? '' }), {})
      );
    } catch (err) {
      console.error('Error fetching:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(fetchProviders, []);

  const handleApproval = async (id, status) => {
    if (status === 'accepted') {
      const raw = rates[id]?.toString().trim();
      const num = Number(raw);
      if (!raw || isNaN(num) || num <= 0) {
        alert('Please enter a valid hourly rate greater than 0.');
        return;
      }
      await writeUpdate(id, status, num);
    } else {
      await writeUpdate(id, status);
    }
  };

  const writeUpdate = async (id, status, hourlyRate = null) => {
    try {
      const ref = doc(db, 'consultants', id);
      const payload =
        hourlyRate != null
          ? { approvalStatus: status, hourlyRate }
          : { approvalStatus: status };
      await updateDoc(ref, payload);
      alert(`Provider has been ${status}.`);
      fetchProviders();
    } catch (err) {
      console.error('Error updating:', err);
      alert('Error saving. Please try again.');
    }
  };

  return (
    <div className="approvals-container">
      <h2 className="font-bold text-3xl mb-5">Provider Approvals</h2>
      {loading ? (
        <p>Loading…</p>
      ) : providers.length === 0 ? (
        <p>No pending applications.</p>
      ) : (
        <div className="application-cards">
          {providers.map(p => (
            <div key={p.id} className="application-card">
              <p><strong>Name:</strong> {p.name}</p>
              <p><strong>Specialty:</strong> {p.specialty}</p>
              <p><strong>Email:</strong> {p.email}</p>

              <div className="mt-2">
                <label className="block mb-1 font-medium">
                  Hourly Rate (₱)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="rate-input px-2 py-1 border rounded w-32"
                  placeholder="e.g. 750"
                  value={rates[p.id]}
                  onChange={e =>
                    setRates({ ...rates, [p.id]: e.target.value })
                  }
                />
              </div>

              <div className="button-group mt-3">
                <button
                  className="accept"
                  onClick={() => handleApproval(p.id, 'accepted')}
                >
                  Accept
                </button>
                <button
                  className="reject ml-2"
                  onClick={() => handleApproval(p.id, 'rejected')}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProviderApprovals; 