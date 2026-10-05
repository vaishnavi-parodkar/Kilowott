import { EmptyState, LinkButton, Card } from '../components/ui.jsx';

export default function NotFound() {
  return (
    <Card>
      <EmptyState title="Page not found" message="The page you are looking for does not exist.">
        <LinkButton to="/" variant="primary">Back to dashboard</LinkButton>
      </EmptyState>
    </Card>
  );
}
