/**
 * Utilitários para manipulação de datas sem desvios de timezone
 */

// Formata uma data local para string YYYY-MM-DD
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Converte YYYY-MM-DD para objeto Date local (evitando UTC shift)
export function parseISODate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Verifica se duas datas caem no mesmo dia civil
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// Nome do mês por extenso e ano (ex: "Outubro de 2026")
export function formatMonthYear(date: Date): string {
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(date);
  return `${month.charAt(0).toUpperCase() + month.slice(1)} de ${date.getFullYear()}`;
}

// Formatação amigável para dia (ex: "Quarta-feira, 14 de Outubro")
export function formatDayFull(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
}

// Retorna os dias que compõem a grade mensal (incluindo dias dos meses vizinhos para preencher 7 colunas)
export function getMonthDaysGrid(year: number, month: number): { date: Date; isCurrentMonth: boolean }[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Domingo, 1 = Segunda...
  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  // Dias do mês anterior para completar o início da semana
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const prevDate = new Date(year, month, -i);
    days.push({ date: prevDate, isCurrentMonth: false });
  }

  // Dias do mês atual
  for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true });
  }

  // Dias do mês seguinte para completar até múltiplo de 7 (geralmente 35 ou 42 dias)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }

  return days;
}

// Retorna os 7 dias da semana contendo a data informada (iniciando no Domingo)
export function getWeekDays(currentDate: Date): Date[] {
  const current = new Date(currentDate);
  const dayOfWeek = current.getDay();
  const startOfWeek = new Date(current);
  startOfWeek.setDate(current.getDate() - dayOfWeek);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }
  return days;
}

export const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAYS_FULL_PT = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];
