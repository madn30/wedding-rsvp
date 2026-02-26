import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';
import s from './LoginPage.module.css';

export const LoginPage = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message || 'שגיאה בהתחברות. בדוק אימייל וסיסמה.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={s.page}>
      <section className={s.card}>
        <header className={s.header}>
          <span className={s.headerIcon} aria-hidden="true">💍</span>
          <h1 className={s.title}>כניסת מנהל</h1>
          <p className={s.subtitle}>ניהול הזמנות לחתונה</p>
        </header>

        <form onSubmit={handleSubmit} className={s.form} noValidate>
          <div className={s.field}>
            <label htmlFor="email" className={s.label}>אימייל</label>
            <input
              id="email"
              type="email"
              className={s.input}
              placeholder="admin@wedding.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              dir="ltr"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className={s.field}>
            <label htmlFor="password" className={s.label}>סיסמה</label>
            <input
              id="password"
              type="password"
              className={s.input}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className={s.errorBox} role="alert">
              <span aria-hidden="true">⚠️</span>
              {error}
            </p>
          )}

          <button type="submit" disabled={isLoading} className={s.submitBtn}>
            {isLoading ? <Spinner size="sm" /> : <span aria-hidden="true">🔑</span>}
            {isLoading ? 'מתחבר...' : 'כניסה'}
          </button>
        </form>
      </section>
    </main>
  );
};
