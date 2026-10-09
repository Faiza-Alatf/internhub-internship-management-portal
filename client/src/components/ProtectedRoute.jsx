import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from './ui/Feedback';

// <ProtectedRoute roles={['ADMIN']}> ... </ProtectedRoute>
export default function ProtectedRoute({ roles, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="card mt-6">
        <EmptyState icon={ShieldAlert} title="Access denied" description="Your role does not have permission to view this page."
          action={<Link to="/" className="btn-primary">Back to dashboard</Link>} />
      </div>
    );
  }
  return children;
}
