import { useProducts } from '../hooks/ProductsContext.jsx';
import { Button, ErrorState } from './ui.jsx';

/** Shared error panel for failures while loading the catalog. */
export function CatalogError() {
  const { error, reload, resetDemoData } = useProducts();
  return (
    <ErrorState title="Could not load the catalog" message={error}>
      <Button variant="secondary" onClick={reload}>Try again</Button>
      <Button variant="danger" onClick={resetDemoData}>Reset sample data</Button>
    </ErrorState>
  );
}
