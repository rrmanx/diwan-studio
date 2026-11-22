import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/app-shell';
import { AboutPage } from './pages/about-page';
import { ApiPage } from './pages/api-page';
import { HomePage } from './pages/home-page';
import { NotFoundPage } from './pages/not-found-page';
import { PoemPage } from './pages/poem-page';
import { PoemsPage } from './pages/poems-page';
import { PoetPage } from './pages/poet-page';
import { PoetsPage } from './pages/poets-page';
import { PreviewPage } from './pages/preview-page';
import { QuotesPage } from './pages/quotes-page';
import { SearchPage } from './pages/search-page';
import { StudioPoemPage } from './pages/studio-poem-page';
import { StudioPage } from './pages/studio-page';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="poets" element={<PoetsPage />} />
        <Route path="poets/:id" element={<PoetPage />} />
        <Route path="poems" element={<PoemsPage />} />
        <Route path="poems/:id" element={<PoemPage />} />
        <Route path="poem/:id" element={<PoemPage />} />
        <Route path="quotes" element={<QuotesPage />} />
        <Route path="studio" element={<StudioPage />} />
        <Route path="studio/:poemId" element={<StudioPoemPage />} />
        <Route path="preview" element={<PreviewPage />} />
        <Route path="api" element={<ApiPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
