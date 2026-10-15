import { Metadata } from 'next';
import { EmployeesManagementView } from '@/components/collaborators/EmployeesManagementView';

export const metadata: Metadata = {
  title: 'Gestão de Funcionários - Sigma',
  description: 'Gerenciamento e edição de funcionários e permissões',
};

export default function FuncionariosPage() {
  return (
    <main>
      <EmployeesManagementView />
    </main>
  );
}
