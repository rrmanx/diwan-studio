import { useParams, useSearchParams } from 'react-router-dom';
import { StudioWorkbench } from './studio-workbench';

export function StudioPoemPage() {
  const { poemId } = useParams();
  const [params] = useSearchParams();
  return <StudioWorkbench poemId={poemId} quoteId={params.get('quote') ?? undefined} />;
}
