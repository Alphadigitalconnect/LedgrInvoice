import React from 'react';
import AuthScreen from './AuthScreen';

export default function AdminLogin({ onLoginSuccess }) {
  return <AuthScreen onAuthSuccess={onLoginSuccess} />;
}
