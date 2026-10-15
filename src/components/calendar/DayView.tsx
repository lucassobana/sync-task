'use client';

import React from 'react';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Heading,
  Text,
  Button,
} from '@chakra-ui/react';
import { Calendar as CalendarIcon, FileText, Plus } from 'lucide-react';
import { Task } from '@/types/database';
import { formatDateToISO, formatDayFull } from '@/lib/dateUtils';

interface DayViewProps {
  currentDate: Date;
  tasks: Task[];
  isManager: boolean;
  onTaskClick: (task: Task) => void;
  onAddTask?: (date: Date) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  tasks,
  isManager,
  onTaskClick,
  onAddTask,
}) => {
  const dateISO = formatDateToISO(currentDate);
  const dayTasks = tasks.filter((t) => t.execution_date === dateISO);

  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      p={{ base: 4, md: 5 }}
      boxShadow="sm"
      flex="1"
      h="full"
      minH="0"
      display="flex"
      flexDir="column"
      overflow="hidden"
    >
      <Flex
        align="center"
        justify="space-between"
        pb={3}
        borderBottomWidth="1px"
        borderColor="gray.200"
        mb={4}
        flexShrink={0}
      >
        <Box>
          <Heading as="h2" size="md" fontWeight="bold" color="gray.900">
            {formatDayFull(currentDate)}
          </Heading>
          <Text fontSize="xs" color="gray.500" mt={0.5}>
            {dayTasks.length} {dayTasks.length === 1 ? 'tarefa agendada' : 'tarefas agendadas'}
          </Text>
        </Box>
        {isManager && onAddTask && (
          <Button
            size="sm"
            bg="brand.600"
            color="white"
            _hover={{ bg: 'brand.700' }}
            fontWeight="semibold"
            px={4}
            onClick={() => onAddTask(currentDate)}
            borderRadius="full"
          >
            <HStack gap={1.5}>
              <Plus size={16} />
              <Text as="span">Adicionar Tarefa</Text>
            </HStack>
          </Button>
        )}
      </Flex>

      <VStack
        gap={2.5}
        align="stretch"
        flex="1"
        overflowY="auto"
        minH="0"
        pr={1}
        sx={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { bg: 'gray.200', borderRadius: 'full' },
        }}
      >
        {dayTasks.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            py={14}
            color="gray.400"
            gap={3}
          >
            <CalendarIcon size={48} strokeWidth={1.5} />
            <Text fontSize="sm">Nenhuma tarefa agendada para este dia.</Text>
          </Flex>
        ) : (
          dayTasks.map((task) => (
            <Flex
              key={task.id}
              onClick={() => onTaskClick(task)}
              align="center"
              justify="space-between"
              p={4}
              borderWidth="1px"
              borderColor="gray.200"
              borderRadius="lg"
              bg="white"
              cursor="pointer"
              transition="all 0.15s ease"
              _hover={{
                borderColor: 'brand.300',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                bg: 'gray.50',
              }}
            >
              <VStack align="flex-start" gap={1}>
                <HStack gap={2}>
                  <FileText size={16} color="#6366f1" />
                  <Text
                    fontWeight="semibold"
                    fontSize="sm"
                    color="gray.900"
                  >
                    {task.title}
                  </Text>
                </HStack>
                {task.description && (
                  <Text fontSize="xs" color="gray.500">
                    {task.description}
                  </Text>
                )}
                <HStack gap={3} fontSize="2xs" color="gray.400" mt={1}>
                  {task.responsible?.full_name && (
                    <Text as="span">
                      Responsável: <strong style={{ color: '#475569' }}>{task.responsible.full_name}</strong>
                    </Text>
                  )}
                  {task.creator?.full_name && (
                    <Text as="span">Criado por: {task.creator.full_name}</Text>
                  )}
                </HStack>
              </VStack>
            </Flex>
          ))
        )}
      </VStack>
    </Box>
  );
};
