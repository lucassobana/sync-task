'use client';

import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Heading,
  Text,
  Badge,
  Button,
  IconButton,
} from '@chakra-ui/react';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, UserPlus } from 'lucide-react';
import { Profile, canManageEmployees, canManageTasks } from '@/types/database';
import { CollaboratorSelect } from './CollaboratorSelect';

export type CalendarViewMode = 'month' | 'week' | 'day';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  currentProfile: Profile | null;
  profiles: Profile[];
  selectedUserId: string;
  onSelectUserChange: (userId: string) => void;
  onOpenNewTaskModal: () => void;
  onOpenNewCollaboratorModal?: () => void;
  onLogout?: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  onViewModeChange,
  onPrev,
  onNext,
  onToday,
  currentProfile,
  profiles,
  selectedUserId,
  onSelectUserChange,
  onOpenNewTaskModal,
  onOpenNewCollaboratorModal,
}) => {
  const isAdmin = canManageEmployees(currentProfile?.role);
  const canManage = canManageTasks(currentProfile?.role);
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long' });

  return (
    <Flex
      as="header"
      wrap="wrap"
      align="center"
      justify="space-between"
      gap={4}
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      p={{ base: 4, md: 5 }}
      borderRadius="2xl"
      boxShadow="sm"
      flexShrink={0}
    >
      {/* Lado Esquerdo: Título do Mês e Navegação */}
      <HStack gap={{ base: 3, md: 5 }} wrap="wrap" align="center">
        {/* Bloco de Data com Ícone */}
        <HStack align="center" gap={3}>
          <Flex
            w="10"
            h="10"
            borderRadius="xl"
            bg="brand.50"
            color="brand.600"
            align="center"
            justify="center"
            borderWidth="1px"
            borderColor="brand.100"
            flexShrink={0}
          >
            <CalendarDays size={20} />
          </Flex>

          {viewMode === 'day' ? (
            <Box>
              <Text fontSize="2xs" fontWeight="700" textTransform="uppercase" color="brand.600" letterSpacing="0.06em">
                {new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(currentDate)}
              </Text>
              <Heading as="h1" fontSize={{ base: 'md', md: 'xl' }} fontWeight="800" color="gray.900" letterSpacing="-0.02em">
                {new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }).format(currentDate)}
              </Heading>
            </Box>
          ) : (
            <HStack align="center" gap={2.5}>
              <Heading
                as="h1"
                fontSize={{ base: 'xl', md: '2xl' }}
                fontWeight="800"
                color="gray.900"
                letterSpacing="-0.03em"
                textTransform="capitalize"
              >
                {monthName}
              </Heading>
              <Badge
                px={2.5}
                py={0.5}
                borderRadius="full"
                bg="gray.100"
                color="gray.600"
                fontSize="xs"
                fontWeight="700"
                borderWidth="1px"
                borderColor="gray.200"
                letterSpacing="0.02em"
              >
                {currentDate.getFullYear()}
              </Badge>
            </HStack>
          )}
        </HStack>

        {/* Controles de Navegação (Anterior, Hoje, Próximo) */}
        <HStack
          bg="gray.50"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          p="1"
          gap={1}
          boxShadow="2xs"
        >
          <IconButton
            size="sm"
            variant="ghost"
            icon={<ChevronLeft size={16} />}
            onClick={onPrev}
            aria-label="Período anterior"
            borderRadius="lg"
            color="gray.600"
            _hover={{ bg: 'white', color: 'gray.900', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}
            transition="all 0.15s ease"
          />

          <Button
            size="sm"
            variant="ghost"
            px={3}
            fontSize="xs"
            fontWeight="700"
            color="gray.700"
            onClick={onToday}
            borderRadius="lg"
            _hover={{ bg: 'white', color: 'gray.900', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}
            transition="all 0.15s ease"
          >
            Hoje
          </Button>

          <IconButton
            size="sm"
            variant="ghost"
            icon={<ChevronRight size={16} />}
            onClick={onNext}
            aria-label="Próximo período"
            borderRadius="lg"
            color="gray.600"
            _hover={{ bg: 'white', color: 'gray.900', boxShadow: '0 1px 2px rgba(0,0,0,0.06)' }}
            transition="all 0.15s ease"
          />
        </HStack>
      </HStack>

      {/* Lado Direito: Modos, Filtros e Ações */}
      <HStack gap={3} wrap="wrap">
        {/* Alternador de Modo de Visualização */}
        <HStack
          bg="gray.50"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          p="1"
          gap={1}
        >
          {(['month', 'week', 'day'] as CalendarViewMode[]).map((mode) => {
            const labels: Record<CalendarViewMode, string> = {
              month: 'Mês',
              week: 'Semana',
              day: 'Dia',
            };
            const isActive = viewMode === mode;
            return (
              <Button
                key={mode}
                size="sm"
                variant="ghost"
                px={3.5}
                py={1.5}
                fontSize="xs"
                fontWeight={isActive ? '700' : '500'}
                bg={isActive ? 'white' : 'transparent'}
                color={isActive ? 'brand.600' : 'gray.500'}
                boxShadow={isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'}
                borderRadius="lg"
                _hover={{ color: isActive ? 'brand.600' : 'gray.900' }}
                onClick={() => onViewModeChange(mode)}
                transition="all 0.15s ease"
              >
                {labels[mode]}
              </Button>
            );
          })}
        </HStack>

        {canManage && profiles.length > 0 && (
          <CollaboratorSelect
            profiles={profiles}
            selectedUserId={selectedUserId}
            onSelectUserChange={onSelectUserChange}
          />
        )}

        {/* Botão Novo Funcionário (Apenas Administrador) */}
        {isAdmin && onOpenNewCollaboratorModal && (
          <Button
            size="sm"
            variant="outline"
            borderColor="gray.300"
            bg="white"
            color="gray.700"
            _hover={{ bg: 'gray.50', borderColor: 'gray.400' }}
            boxShadow="0 1px 2px rgba(0, 0, 0, 0.05)"
            fontWeight="semibold"
            px={3.5}
            onClick={onOpenNewCollaboratorModal}
            borderRadius="full"
          >
            <HStack gap={1.5}>
              <UserPlus size={16} color="#4f46e5" />
              <Text as="span">Novo Funcionário</Text>
            </HStack>
          </Button>
        )}

        {/* Botão Nova Tarefa (Admin e Gestor) */}
        {canManage && (
          <Button
            size="sm"
            bg="brand.600"
            color="white"
            _hover={{ bg: 'brand.700' }}
            boxShadow="0 1px 3px rgba(79, 70, 229, 0.25)"
            fontWeight="semibold"
            px={4}
            onClick={onOpenNewTaskModal}
            borderRadius="full"
          >
            <HStack gap={1.5}>
              <Plus size={16} />
              <Text as="span">Nova Tarefa</Text>
            </HStack>
          </Button>
        )}
      </HStack>
    </Flex>
  );
};
