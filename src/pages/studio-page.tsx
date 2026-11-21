import { useSearchParams } from 'react-router-dom';
import { StudioWorkbench } from './studio-workbench';

export function StudioPage() {
  const [params] = useSearchParams();
  return <StudioWorkbench quoteId={params.get('quote') ?? undefined} />;
}
