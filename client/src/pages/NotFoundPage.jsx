import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../components/ui/Feedback';

export default function NotFoundPage() {
  return (
    <div className="card mt-6">
      <EmptyState icon={Compass} title="Page not found" description="The page you are looking for does not exist or has been moved."
        action={<Link to="/" className="btn-primary">Back to dashboard</Link>} />
    </div>
  );
}
