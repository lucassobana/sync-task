'use client';

import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useToast,
  Text,
  VStack,
  HStack,
  Flex,
} from '@chakra-ui/react';
import { AlertTriangle } from 'lucide-react';
import { deleteCollaboratorAction } from '@/app/actions/collaborators';
import { CollaboratorWithEmail } from '@/types/database';

interface DeleteCollaboratorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  collaborator: CollaboratorWithEmail | null;
  onSuccess: () => void;
}

export const DeleteCollaboratorDialog: React.FC<DeleteCollaboratorDialogProps> = ({
  isOpen,
  onClose,
  collaborator,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const toast = useToast();

  const handleDelete = async () => {
    if (!collaborator) return;

    try {
      setLoading(true);
      const res = await deleteCollaboratorAction(collaborator.id);

      if (!res.success) {
        toast({
          title: 'Erro ao excluir',
          description: res.error || 'Não foi possível excluir o funcionário.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      toast({
        title: 'Funcionário excluído',
        description: `${collaborator.full_name} foi removido com sucesso.`,
        status: 'info',
        duration: 4000,
        isClosable: true,
      });

      onSuccess();
      onClose();
    } catch {
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao tentar excluir o funcionário.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!collaborator) return null;

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
    >
      <AlertDialogOverlay bg="blackAlpha.600" backdropFilter="blur(4px)">
        <AlertDialogContent
          borderRadius="2xl"
          boxShadow="2xl"
          borderWidth="1px"
          borderColor="gray.200"
          overflow="hidden"
          p={2}
        >
          <AlertDialogHeader pt={4} px={4} pb={2}>
            <HStack gap={3}>
              <Flex
                w={10}
                h={10}
                borderRadius="full"
                bg="red.50"
                color="red.600"
                align="center"
                justify="center"
                flexShrink={0}
              >
                <AlertTriangle size={20} />
              </Flex>
              <Text fontSize="md" fontWeight="bold" color="gray.900">
                Excluir Funcionário
              </Text>
            </HStack>
          </AlertDialogHeader>

          <AlertDialogBody px={4} py={2}>
            <VStack align="stretch" gap={2}>
              <Text fontSize="sm" color="gray.600">
                Tem certeza que deseja excluir <strong>{collaborator.full_name}</strong>?
              </Text>
              <Text fontSize="xs" color="red.600" bg="red.50" p={3} borderRadius="lg">
                Esta ação é irreversível. O acesso do usuário será revogado e todas as tarefas
                atribuídas a ele serão removidas.
              </Text>
            </VStack>
          </AlertDialogBody>

          <AlertDialogFooter pb={3} px={4} pt={4} gap={3}>
            <Button
              ref={cancelRef}
              onClick={onClose}
              size="sm"
              variant="ghost"
              borderRadius="xl"
            >
              Cancelar
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDelete}
              isLoading={loading}
              loadingText="Excluindo..."
              size="sm"
              borderRadius="xl"
              fontWeight="bold"
            >
              Sim, Excluir
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};
