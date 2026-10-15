'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Flex, Spinner } from '@chakra-ui/react';
import { createClient } from '@/lib/supabase/client';
import { Task, Profile, canManageTasks } from '@/types/database';
import { formatDateToISO, getMonthDaysGrid, getWeekDays } from '@/lib/dateUtils';
import { CalendarHeader, CalendarViewMode } from './CalendarHeader';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { TaskModal } from './TaskModal';
import { NewCollaboratorModal } from './NewCollaboratorModal';

export function UserCalendar() {
  const router = useRouter();
  const supabase = createClient();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Controle do modal de tarefa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<Date | null>(null);

  // Controle do modal de cadastro de colaborador
  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);

  // 1. Carrega lista de perfis
  const loadProfiles = useCallback(async () => {
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });
    if (allProfiles) setProfiles(allProfiles);
  }, [supabase]);

  // Carrega dados do perfil logado
  useEffect(() => {
    async function loadUser() {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCurrentProfile(profile);

        // Se puder gerenciar tarefas (admin ou gestor), carrega todos os perfis para filtro e delegação
        if (canManageTasks(profile.role)) {
          loadProfiles();
        } else {
          setProfiles([profile]);
        }
      }
    }
    loadUser();
  }, [supabase, router, loadProfiles]);

  // 2. Calcula período de busca de tarefas conforme o modo de visualização
  const getDateRange = useCallback(() => {
    if (viewMode === 'month') {
      const days = getMonthDaysGrid(currentDate.getFullYear(), currentDate.getMonth());
      return {
        start: formatDateToISO(days[0].date),
        end: formatDateToISO(days[days.length - 1].date),
      };
    } else if (viewMode === 'week') {
      const days = getWeekDays(currentDate);
      return {
        start: formatDateToISO(days[0]),
        end: formatDateToISO(days[days.length - 1]),
      };
    } else {
      const iso = formatDateToISO(currentDate);
      return { start: iso, end: iso };
    }
  }, [currentDate, viewMode]);

  // 3. Busca tarefas no Supabase
  const fetchTasks = useCallback(async () => {
    if (!currentProfile) return;
    try {
      setLoading(true);
      const { start, end } = getDateRange();

      let query = supabase
        .from('tasks')
        .select(`
          *,
          responsible:responsible_user_id (id, full_name),
          creator:created_by_user_id (id, full_name)
        `)
        .gte('execution_date', start)
        .lte('execution_date', end)
        .order('execution_date', { ascending: true });

      // Regra de Isolamento de Tarefas:
      // Se NÃO puder gerenciar tarefas (visualizador), SEMPRE filtra estritamente as tarefas atribuídas ao próprio usuário
      if (!canManageTasks(currentProfile.role)) {
        query = query.eq('responsible_user_id', currentProfile.id);
      } else if (selectedUserId !== 'all') {
        // Se puder gerenciar (admin ou gestor) e escolheu um funcionário específico no filtro
        query = query.eq('responsible_user_id', selectedUserId);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Erro ao buscar tarefas:', error.message);
      } else {
        setTasks(data as unknown as Task[]);
      }
    } finally {
      setLoading(false);
    }
  }, [currentProfile, getDateRange, selectedUserId, supabase]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // 4. Navegação temporal
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const nextDate = new Date(prev);
      if (viewMode === 'month') nextDate.setMonth(nextDate.getMonth() - 1);
      else if (viewMode === 'week') nextDate.setDate(nextDate.getDate() - 7);
      else nextDate.setDate(nextDate.getDate() - 1);
      return nextDate;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const nextDate = new Date(prev);
      if (viewMode === 'month') nextDate.setMonth(nextDate.getMonth() + 1);
      else if (viewMode === 'week') nextDate.setDate(nextDate.getDate() + 7);
      else nextDate.setDate(nextDate.getDate() + 1);
      return nextDate;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // 5. Abertura do modal de tarefas
  const handleOpenNewTask = (initialDate?: Date) => {
    setActiveTask(null);
    setModalInitialDate(initialDate || currentDate);
    setIsModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setActiveTask(task);
    setModalInitialDate(null);
    setIsModalOpen(true);
  };

  // 6. Ações de CRUD (Save, Status Change, Delete)
  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (taskData.id) {
      // Atualização
      const { error } = await supabase
        .from('tasks')
        .update(taskData)
        .eq('id', taskData.id);

      if (error) throw new Error(error.message);
    } else {
      // Criação
      const { error } = await supabase
        .from('tasks')
        .insert([{
          ...taskData,
          created_by_user_id: currentProfile?.id,
        }]);

      if (error) throw new Error(error.message);
    }
    await fetchTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw new Error(error.message);
    await fetchTasks();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const canManage = canManageTasks(currentProfile?.role);

  return (
    <Box
      w="full"
      maxW="1400px"
      mx="auto"
      p={{ base: 4, md: 4 }}
      h={{ base: 'auto', md: 'calc(100vh - 96px)' }}
      display="flex"
      flexDir="column"
      gap={3.5}
      overflow={{ base: 'auto', md: 'hidden' }}
    >
      <CalendarHeader
        currentDate={currentDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        currentProfile={currentProfile}
        profiles={profiles}
        selectedUserId={selectedUserId}
        onSelectUserChange={setSelectedUserId}
        onOpenNewTaskModal={() => handleOpenNewTask()}
        onOpenNewCollaboratorModal={() => setIsCollaboratorModalOpen(true)}
        onLogout={handleLogout}
      />

      {loading ? (
        <Flex align="center" justify="center" flex="1">
          <Spinner size="lg" color="brand.600" />
        </Flex>
      ) : viewMode === 'month' ? (
        <MonthView
          currentDate={currentDate}
          tasks={tasks}
          isManager={canManage}
          onTaskClick={handleTaskClick}
          onDayClickAdd={canManage ? (date) => handleOpenNewTask(date) : undefined}
        />
      ) : viewMode === 'week' ? (
        <WeekView
          currentDate={currentDate}
          tasks={tasks}
          isManager={canManage}
          onTaskClick={handleTaskClick}
          onDayClickAdd={canManage ? (date) => handleOpenNewTask(date) : undefined}
        />
      ) : (
        <DayView
          currentDate={currentDate}
          tasks={tasks}
          isManager={canManage}
          onTaskClick={handleTaskClick}
          onAddTask={canManage ? (date) => handleOpenNewTask(date) : undefined}
        />
      )}

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={activeTask}
        initialDate={modalInitialDate}
        profiles={profiles}
        currentProfile={currentProfile}
        onSaveTask={handleSaveTask}
        onDeleteTask={canManage ? handleDeleteTask : undefined}
      />

      <NewCollaboratorModal
        isOpen={isCollaboratorModalOpen}
        onClose={() => setIsCollaboratorModalOpen(false)}
        onSuccess={() => {
          loadProfiles();
          fetchTasks();
        }}
      />
    </Box>
  );
}
