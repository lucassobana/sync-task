'use client';

import React from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { Task } from '@/types/database';

interface TaskItemProps {
  task: Task;
  onClick: (task: Task) => void;
  showResponsible?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onClick,
  showResponsible = false,
}) => {
  return (
    <Box
      bg="brand.50"
      color="brand.900"
      borderLeftWidth="3px"
      borderLeftColor="brand.600"
      p="1.5"
      px="2"
      borderRadius="md"
      cursor="pointer"
      transition="all 0.15s ease"
      _hover={{
        transform: 'translateY(-1px)',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
        bg: 'brand.100',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick(task);
      }}
      title={task.title}
      userSelect="none"
    >
      <Text
        fontSize="xs"
        fontWeight="semibold"
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
      >
        {task.title}
      </Text>
      {showResponsible && task.responsible?.full_name && (
        <Flex align="center" justify="flex-end" fontSize="2xs" mt="0.5" opacity={0.85}>
          <Text as="span" fontWeight="medium" color="brand.700">
            {task.responsible.full_name.split(' ')[0]}
          </Text>
        </Flex>
      )}
    </Box>
  );
};
