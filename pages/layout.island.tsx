import type { ReactNode } from 'react';
import { Header, Footer } from '../src/components/blog';
import '../src/styles.css';
import 'katex/dist/katex.min.css';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
