'use client';

import React from 'react';
import { Box, Flex, Grid, VStack, Text, Button } from '@chakra-ui/react';
import { Plus } from 'lucide-react';
import { Task } from '@/types/database';
import {
  getWeekDays,
  formatDateToISO,
  isSameDay,
  WEEKDAYS_PT,
} from '@/lib/dateUtils';
import { TaskItem } from './TaskItem';

interface WeekViewProps {
  currentDate: Date;
  tasks: Task[];
  isManager: boolean;
  onTaskClick: (task: Task) => void;
  onDayClickAdd?: (date: Date) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  currentDate,
  tasks,
  isManager,
  onTaskClick,
  onDayClickAdd,
}) => {
  const weekDays = getWeekDays(currentDate);
  const today = new Date();

  const tasksByDate = React.useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      const existing = map.get(task.execution_date) || [];
      existing.push(task);
      map.set(task.execution_date, existing);
    });
    return map;
  }, [tasks]);

  return (
    <Grid
      templateColumns="repeat(7, 1fr)"
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="sm"
      flex="1"
      h="full"
      minH="0"
    >
      {weekDays.map((day, idx) => {
        const dateISO = formatDateToISO(day);
        const dayTasks = tasksByDate.get(dateISO) || [];
        const isToday = isSameDay(day, today);

        return (
          <Box
            key={dateISO}
            display="flex"
            flexDir="column"
            bg="white"
            borderRightWidth={idx < 6 ? '1px' : '0px'}
            borderColor="gray.200"
            h="full"
            minH="0"
            overflow="hidden"
          >
            {/* Header da coluna */}
            <Flex
              direction="column"
              align="center"
              justify="center"
              py={2}
              px={2}
              bg="gray.50"
              borderBottomWidth="1px"
              borderColor="gray.200"
              gap={0.5}
              position="relative"
              flexShrink={0}
            >
              <Text fontSize="2xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                {WEEKDAYS_PT[idx]}
              </Text>
              <Flex
                w={7}
                h={7}
                align="center"
                justify="center"
                borderRadius="full"
                fontSize="sm"
                fontWeight={isToday ? 'bold' : 'semibold'}
                bg={isToday ? 'brand.600' : 'transparent'}
                color={isToday ? 'white' : 'gray.900'}
              >
                {day.getDate()}
              </Flex>

              {isManager && onDayClickAdd && (
                <Button
                  size="xs"
                  variant="ghost"
                  position="absolute"
                  right={1}
                  top={1}
                  p={1}
                  h={6}
                  w={6}
                  minW={6}
                  borderRadius="md"
                  color="gray.400"
                  _hover={{ bg: 'gray.200', color: 'gray.900' }}
                  onClick={() => onDayClickAdd(day)}
                  title="Adicionar tarefa neste dia"
                  aria-label={`Adicionar tarefa em ${dateISO}`}
                >
                  <Plus size={13} />
                </Button>
              )}
            </Flex>

            {/* Corpo da coluna com tarefas */}
            <VStack
              flex="1"
              p={2}
              gap={1.5}
              align="stretch"
              overflowY="auto"
              minH="0"
              sx={{
                '&::-webkit-scrollbar': { width: '4px' },
                '&::-webkit-scrollbar-track': { bg: 'gray.100', borderRadius: 'full' },
                '&::-webkit-scrollbar-thumb': { bg: 'brand.300', borderRadius: 'full' },
                '&::-webkit-scrollbar-thumb:hover': { bg: 'brand.500' },
              }}
            >
              {dayTasks.length === 0 ? (
                <Text py={4} textAlign="center" color="gray.400" fontSize="2xs">
                  Sem tarefas
                </Text>
              ) : (
                dayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onClick={onTaskClick}
                    showResponsible={isManager}
                  />
                ))
              )}
            </VStack>
          </Box>
        );
      })}
    </Grid>
  );
};
