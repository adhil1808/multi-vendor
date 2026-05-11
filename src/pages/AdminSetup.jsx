import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminSetup() {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [msg, setMsg] = useState('');
  const navigate = useNavigate();

  const handleCreate = async () => {
    setStatus('loading');
    try {
      // 1. Create in Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, 'adhil.admin@fooddies.com', 'adhil@2013');
      
      // 2. Create Profile in Firestore
      await setDoc(doc(db, "users", userCred.user.uid), {
        name: 'Adhil Admin',
        email: 'adhil.admin@fooddies.com',
        role: 'SUPER_ADMIN',
        createdAt: new Date().toISOString()
      });

      setStatus('success');
      setMsg('Super Admin account created successfully! You can now log in.');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMsg(err.message || 'Failed to create admin account. It might already exist.');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '24px' }}>
      <div className="card" style={{ maxWidth: '450px', width: '100%', textAlign: 'center' }}>
        <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={40} />
        </div>
        <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '12px' }}>Super Admin Setup</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Click the button below to initialize the primary Super Admin account for <strong>adhil@fooddies</strong>.
        </p>

        {status === 'success' ? (
          <div className="animate-fade-in" style={{ background: '#D1FAE5', color: '#065F46', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontWeight: '600' }}>
            {msg}
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={() => navigate('/login')}>
              Go to Login <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <>
            {status === 'error' && (
              <div style={{ color: '#991B1B', background: '#FEE2E2', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                {msg}
              </div>
            )}
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '18px', fontSize: '16px' }} 
              onClick={handleCreate}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Creating Account...' : 'Initialize Admin Account'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
