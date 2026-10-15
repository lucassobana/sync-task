'use client';

import React, { useRef } from 'react';
import {
  Box,
  Flex,
  Grid,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
} from '@chakra-ui/react';
import { Plus, ChevronDown } from 'lucide-react';
import { Task } from '@/types/database';
import {
  getMonthDaysGrid,
  formatDateToISO,
  isSameDay,
  WEEKDAYS_PT,
} from '@/lib/dateUtils';
import { TaskItem } from './TaskItem';

interface MonthViewProps {
  currentDate: Date;
  tasks: Task[];
  isManager: boolean;
  onTaskClick: (task: Task) => void;
  onDayClickAdd?: (date: Date) => void;
}

interface MonthDayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  dayTasks: Task[];
  isToday: boolean;
  isManager: boolean;
  onTaskClick: (task: Task) => void;
  onDayClickAdd?: (date: Date) => void;
}

const MonthDayCell: React.FC<MonthDayCellProps> = ({
  date,
  isCurrentMonth,
  dayTasks,
  isToday,
  isManager,
  onTaskClick,
  onDayClickAdd,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dateISO = formatDateToISO(date);
  const hasMoreThanTwo = dayTasks.length > 2;
  const extraCount = dayTasks.length - 2;

  const handleScrollMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ top: 75, behavior: 'smooth' });
    }
  };

  return (
    <Box
      bg={isCurrentMonth ? 'white' : 'gray.50'}
      p={1.5}
      display="flex"
      flexDir="column"
      gap={1}
      h="full"
      minH={{ base: '100px', md: '0' }}
      position="relative"
      transition="background 0.15s ease"
      _hover={{ bg: isCurrentMonth ? 'gray.50' : 'gray.100' }}
      opacity={isCurrentMonth ? 1 : 0.65}
      overflow="hidden"
    >
      <Flex align="center" justify="space-between" flexShrink={0}>
        <HStack align="center" gap={1.5} minW="0">
          <Flex
            w={6}
            h={6}
            align="center"
            justify="center"
            borderRadius="full"
            fontSize="xs"
            fontWeight={isToday ? 'bold' : 'semibold'}
            bg={isToday ? 'brand.600' : 'transparent'}
            color={isToday ? 'white' : 'gray.900'}
            flexShrink={0}
          >
            {date.getDate()}
          </Flex>

          {hasMoreThanTwo && (
            <Badge
              size="xs"
              bg="brand.50"
              color="brand.700"
              borderRadius="full"
              px={1.5}
              py={0.2}
              fontSize="3xs"
              fontWeight="bold"
              borderWidth="1px"
              borderColor="brand.200"
              boxShadow="2xs"
              cursor="pointer"
              _hover={{
                bg: 'brand.100',
                borderColor: 'brand.300',
                transform: 'scale(1.03)',
              }}
              transition="all 0.15s ease"
              onClick={handleScrollMore}
              title={`${dayTasks.length} tarefas neste dia. Clique ou role para ver mais.`}
              userSelect="none"
              flexShrink={0}
            >
              <HStack gap={0.5}>
                <Text as="span">+{extraCount} mais</Text>
                <ChevronDown size={10} />
              </HStack>
            </Badge>
          )}
        </HStack>

        {isManager && onDayClickAdd && (
          <Button
            size="xs"
            variant="ghost"
            p={0.5}
            h={6}
            w={6}
            minW={6}
            borderRadius="md"
            color="gray.400"
            _hover={{ bg: 'gray.200', color: 'gray.900' }}
            onClick={() => onDayClickAdd(date)}
            title="Adicionar tarefa neste dia"
            aria-label={`Adicionar tarefa em ${dateISO}`}
            flexShrink={0}
          >
            <Plus size={13} />
          </Button>
        )}
      </Flex>

      {/* Lista de tarefas do dia com rolagem interna */}
      <VStack
        ref={scrollRef}
        gap={1}
        align="stretch"
        flex="1"
        overflowY="auto"
        pb={hasMoreThanTwo ? 2 : 0}
        sx={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { bg: 'gray.100', borderRadius: 'full' },
          '&::-webkit-scrollbar-thumb': { bg: 'brand.300', borderRadius: 'full' },
          '&::-webkit-scrollbar-thumb:hover': { bg: 'brand.500' },
        }}
      >
        {dayTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onClick={onTaskClick}
            showResponsible={isManager}
          />
        ))}
      </VStack>

      {/* Indicador visual inferior sutil quando há mais tarefas */}
      {hasMoreThanTwo && (
        <Flex
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          h="14px"
          bgGradient={
            isCurrentMonth
              ? 'linear(to-t, white 60%, transparent)'
              : 'linear(to-t, gray.50 60%, transparent)'
          }
          align="flex-end"
          justify="center"
          pointerEvents="none"
          zIndex={1}
        >
          <ChevronDown size={11} color="#6366f1" style={{ opacity: 0.85 }} />
        </Flex>
      )}
    </Box>
  );
};

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  tasks,
  isManager,
  onTaskClick,
  onDayClickAdd,
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysGrid = getMonthDaysGrid(year, month);
  const today = new Date();

  // Mapeia tarefas por data ISO 'YYYY-MM-DD' para busca rápida O(1)
  const tasksByDate = React.useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      const existing = map.get(task.execution_date) || [];
      existing.push(task);
      map.set(task.execution_date, existing);
    });
    return map;
  }, [tasks]);

  const rowCount = Math.ceil(daysGrid.length / 7);

  return (
    <Box
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="xl"
      overflow="hidden"
      boxShadow="sm"
      flex="1"
      display="flex"
      flexDir="column"
      h="full"
      minH="0"
    >
      {/* Cabeçalho dos dias da semana */}
      <Grid
        templateColumns="repeat(7, 1fr)"
        bg="gray.50"
        borderBottomWidth="1px"
        borderColor="gray.200"
        flexShrink={0}
      >
        {WEEKDAYS_PT.map((dayName) => (
          <Box
            key={dayName}
            py={2}
            px={2}
            textAlign="center"
            fontSize="xs"
            fontWeight="bold"
            textTransform="uppercase"
            letterSpacing="0.05em"
            color="gray.500"
          >
            {dayName}
          </Box>
        ))}
      </Grid>

      {/* Grade de dias do mês que preenche a altura disponível */}
      <Grid
        templateColumns="repeat(7, 1fr)"
        templateRows={{
          base: 'repeat(auto-fit, minmax(100px, 1fr))',
          md: `repeat(${rowCount}, minmax(0, 1fr))`,
        }}
        flex="1"
        bg="gray.200"
        gap="1px"
        minH="0"
      >
        {daysGrid.map(({ date, isCurrentMonth }, index) => {
          const dateISO = formatDateToISO(date);
          const dayTasks = tasksByDate.get(dateISO) || [];
          const isToday = isSameDay(date, today);

          return (
            <MonthDayCell
              key={`${dateISO}-${index}`}
              date={date}
              isCurrentMonth={isCurrentMonth}
              dayTasks={dayTasks}
              isToday={isToday}
              isManager={isManager}
              onTaskClick={onTaskClick}
              onDayClickAdd={onDayClickAdd}
            />
          );
        })}
      </Grid>
    </Box>
  );
};
