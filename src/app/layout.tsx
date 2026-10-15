import type { Metadata } from 'next';
import { Provider } from '@/components/ui/provider';
import Header from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'Calendário de Tarefas - Sigma',
  description: 'Sistema de gerenciamento de tarefas em calendário',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Provider>
          <Header />
          {children}
        </Provider>
      </body>
    </html>
  );
}
