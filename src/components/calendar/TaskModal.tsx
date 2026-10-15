'use client';

import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  Flex,
  Box,
  Text,
} from '@chakra-ui/react';
import { Trash2 } from 'lucide-react';
import { Task, Profile, canManageTasks } from '@/types/database';
import { formatDateToISO } from '@/lib/dateUtils';
import { CollaboratorSelect } from './CollaboratorSelect';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  initialDate?: Date | null;
  profiles: Profile[];
  currentProfile: Profile | null;
  onSaveTask: (taskData: Partial<Task>) => Promise<void>;
  onDeleteTask?: (taskId: string) => Promise<void>;
}

function TaskModalContent({
  onClose,
  task,
  initialDate,
  profiles,
  currentProfile,
  onSaveTask,
  onDeleteTask,
}: Omit<TaskModalProps, 'isOpen'>) {
  const canManage = canManageTasks(currentProfile?.role);
  const isEditing = !!task;

  const [title, setTitle] = useState(task ? task.title : '');
  const [description, setDescription] = useState(task ? task.description || '' : '');
  const [executionDate, setExecutionDate] = useState(
    task
      ? task.execution_date
      : initialDate
      ? formatDateToISO(initialDate)
      : formatDateToISO(new Date())
  );
  const [responsibleUserId, setResponsibleUserId] = useState(
    task
      ? task.responsible_user_id
      : profiles[0]?.id || currentProfile?.id || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  const handleSave = async () => {
    if (!canManage) return;

    if (!title.trim() || !executionDate || !responsibleUserId) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o título, a data e selecione o funcionário responsável.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && task) {
        await onSaveTask({
          id: task.id,
          title: title.trim(),
          description: description.trim() || null,
          execution_date: executionDate,
          responsible_user_id: responsibleUserId,
        });
      } else {
        await onSaveTask({
          title: title.trim(),
          description: description.trim() || null,
          execution_date: executionDate,
          responsible_user_id: responsibleUserId,
        });
      }

      toast({
        title: isEditing ? 'Tarefa atualizada' : 'Tarefa criada',
        description: isEditing
          ? 'Alterações salvas com sucesso.'
          : 'A nova tarefa foi adicionada ao calendário.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar a tarefa.';
      toast({
        title: 'Erro ao salvar tarefa',
        description: message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !onDeleteTask) return;
    if (window.confirm(`Tem certeza que deseja excluir a tarefa "${task.title}"?`)) {
      setIsDeleting(true);
      try {
        await onDeleteTask(task.id);
        toast({
          title: 'Tarefa excluída',
          description: 'A tarefa foi removida com sucesso.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        onClose();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao excluir a tarefa.';
        toast({
          title: 'Erro ao excluir tarefa',
          description: message,
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <ModalContent borderRadius="2xl">
      <ModalHeader fontWeight="700">
        {isEditing
          ? canManage
            ? 'Editar Tarefa'
            : 'Detalhes da Tarefa'
          : 'Nova Tarefa'}
      </ModalHeader>
      <ModalCloseButton />

      <ModalBody>
        <FormControl isRequired mb={4} isReadOnly={!canManage}>
          <FormLabel fontSize="sm" fontWeight="600">
            Título da Tarefa
          </FormLabel>
          <Input
            placeholder="Ex: Fechamento de balanço mensal"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            focusBorderColor="brand.500"
            borderRadius="xl"
            isDisabled={!canManage || isLoading || isDeleting}
          />
        </FormControl>

        <FormControl mb={4} isReadOnly={!canManage}>
          <FormLabel fontSize="sm" fontWeight="600">
            Descrição (Opcional)
          </FormLabel>
          <Textarea
            placeholder="Instruções ou detalhes sobre a tarefa..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            focusBorderColor="brand.500"
            borderRadius="xl"
            rows={3}
            isDisabled={!canManage || isLoading || isDeleting}
          />
        </FormControl>

        <FormControl isRequired mb={4} isReadOnly={!canManage}>
          <FormLabel fontSize="sm" fontWeight="600">
            Data de Execução
          </FormLabel>
          <Input
            type="date"
            value={executionDate}
            onChange={(e) => setExecutionDate(e.target.value)}
            focusBorderColor="brand.500"
            borderRadius="xl"
            isDisabled={!canManage || isLoading || isDeleting}
          />
        </FormControl>

        <FormControl isRequired mb={2}>
          <FormLabel fontSize="sm" fontWeight="600">
            Funcionário Responsável
          </FormLabel>
          {canManage ? (
            <CollaboratorSelect
              profiles={profiles}
              selectedUserId={responsibleUserId}
              onSelectUserChange={(uid) => setResponsibleUserId(uid)}
              allowAll={false}
            />
          ) : (
            <Box p={3.5} bg="gray.50" borderRadius="xl" border="1px" borderColor="gray.200">
              <Text fontSize="sm" color="gray.800" fontWeight="600">
                {task?.responsible?.full_name || 'Não atribuído'}
              </Text>
            </Box>
          )}
        </FormControl>
      </ModalBody>

      <ModalFooter gap={3}>
        {/* Para visualizadores (somente leitura) */}
        {!canManage ? (
          <Button variant="ghost" borderRadius="xl" onClick={onClose}>
            Fechar
          </Button>
        ) : (
          <>
            {isEditing && onDeleteTask && (
              <Flex flex={1}>
                <Button
                  variant="ghost"
                  colorScheme="red"
                  leftIcon={<Trash2 size={16} />}
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  borderRadius="xl"
                >
                  Excluir
                </Button>
              </Flex>
            )}

            <Button
              variant="ghost"
              borderRadius="xl"
              onClick={onClose}
              isDisabled={isLoading || isDeleting}
            >
              Cancelar
            </Button>

            <Button
              bg="brand.600"
              color="white"
              borderRadius="xl"
              _hover={{ bg: 'brand.700' }}
              onClick={handleSave}
              isLoading={isLoading}
              loadingText="Salvando"
              isDisabled={isDeleting}
            >
              {isEditing ? 'Salvar' : 'Adicionar Tarefa'}
            </Button>
          </>
        )}
      </ModalFooter>
    </ModalContent>
  );
}

export function TaskModal(props: TaskModalProps) {
  const formKey = props.task?.id || (props.initialDate ? props.initialDate.toISOString() : 'new');

  return (
    <Modal isOpen={props.isOpen} onClose={props.onClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      {props.isOpen && <TaskModalContent key={formKey} {...props} />}
    </Modal>
  );
}
