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
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Select,
  useToast,
  VStack,
  HStack,
  Flex,
  Text,
  Badge,
  Box,
  Divider,
} from '@chakra-ui/react';
import {
  UserCheck,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  KeyRound,
  RotateCw,
} from 'lucide-react';
import { updateCollaboratorAction } from '@/app/actions/collaborators';
import { CollaboratorWithEmail, UserRole, getRoleLabel } from '@/types/database';

interface EditCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborator: CollaboratorWithEmail | null;
  onSuccess: () => void;
  currentUserId?: string;
}

interface EditCollaboratorFormProps {
  collaborator: CollaboratorWithEmail;
  onClose: () => void;
  onSuccess: () => void;
  currentUserId?: string;
}

const EditCollaboratorForm: React.FC<EditCollaboratorFormProps> = ({
  collaborator,
  onClose,
  onSuccess,
  currentUserId,
}) => {
  const [fullName, setFullName] = useState(collaborator.full_name || '');
  const [email, setEmail] = useState(collaborator.email || '');
  const [role, setRole] = useState<UserRole>(collaborator.role || 'user');
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const toast = useToast();
  const isEditingSelf = Boolean(currentUserId === collaborator.id);

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let generated = '';
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, informe o nome completo do funcionário.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (changePassword && newPassword && newPassword.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A nova senha deve ter no mínimo 6 caracteres.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      const res = await updateCollaboratorAction({
        id: collaborator.id,
        fullName: fullName.trim(),
        role,
        email: email.trim() || undefined,
        password: changePassword && newPassword ? newPassword : undefined,
      });

      if (!res.success) {
        toast({
          title: 'Erro ao salvar',
          description: res.error || 'Não foi possível atualizar o funcionário.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      toast({
        title: 'Funcionário atualizado com sucesso!',
        description: `Os dados de ${fullName} foram salvos.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      onSuccess();
      onClose();
    } catch {
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro ao tentar salvar as alterações.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalContent
      as="form"
      onSubmit={handleSubmit}
      borderRadius="2xl"
      boxShadow="2xl"
      borderWidth="1px"
      borderColor="gray.200"
      overflow="hidden"
    >
      <ModalHeader
        bg="gray.50"
        borderBottomWidth="1px"
        borderColor="gray.200"
        py={4}
        px={6}
      >
        <HStack gap={3}>
          <Flex
            w={10}
            h={10}
            borderRadius="xl"
            bg="brand.50"
            color="brand.600"
            align="center"
            justify="center"
            borderWidth="1px"
            borderColor="brand.100"
          >
            <UserCheck size={20} />
          </Flex>
          <Box>
            <Text fontSize="md" fontWeight="bold" color="gray.900">
              Editar Funcionário
            </Text>
            <Text fontSize="xs" color="gray.500" fontWeight="normal">
              Altere informações cadastrais, nível de permissão ou redefina a senha.
            </Text>
          </Box>
        </HStack>
      </ModalHeader>
      <ModalCloseButton top={4} right={4} />

      <ModalBody p={6}>
        <VStack gap={4.5} align="stretch">
          {/* Nome Completo */}
          <FormControl isRequired>
            <FormLabel fontSize="xs" fontWeight="bold" color="gray.700" mb={1.5}>
              Nome Completo
            </FormLabel>
            <InputGroup size="md">
              <InputLeftElement pointerEvents="none" color="gray.400">
                <User size={18} />
              </InputLeftElement>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Ana Silva"
                borderRadius="xl"
                fontSize="sm"
                focusBorderColor="brand.500"
              />
            </InputGroup>
          </FormControl>

          {/* E-mail de Login */}
          <FormControl>
            <FormLabel fontSize="xs" fontWeight="bold" color="gray.700" mb={1.5}>
              E-mail de Login
            </FormLabel>
            <InputGroup size="md">
              <InputLeftElement pointerEvents="none" color="gray.400">
                <Mail size={18} />
              </InputLeftElement>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@empresa.com"
                borderRadius="xl"
                fontSize="sm"
                focusBorderColor="brand.500"
              />
            </InputGroup>
          </FormControl>

          {/* Nível de Permissão (Cargo) */}
          <FormControl isRequired>
            <Flex justify="space-between" align="center" mb={1.5}>
              <FormLabel fontSize="xs" fontWeight="bold" color="gray.700" mb={0}>
                Cargo / Permissão
              </FormLabel>
              <Badge
                colorScheme={
                  role === 'admin' ? 'purple' : role === 'manager' ? 'blue' : 'gray'
                }
                borderRadius="full"
                px={2}
                fontSize="2xs"
                textTransform="none"
                fontWeight="bold"
              >
                {getRoleLabel(role)}
              </Badge>
            </Flex>
            <InputGroup size="md">
              <InputLeftElement pointerEvents="none" color="gray.400">
                <Shield size={18} />
              </InputLeftElement>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                borderRadius="xl"
                fontSize="sm"
                pl={10}
                focusBorderColor="brand.500"
                isDisabled={isEditingSelf}
              >
                <option value="user">Visualizador (Apenas visualiza suas tarefas)</option>
                <option value="manager">Gestor de Tarefas (Cria e edita tarefas)</option>
                <option value="admin">Administrador (Controle total do sistema)</option>
              </Select>
            </InputGroup>
            {isEditingSelf && (
              <Text fontSize="2xs" color="purple.600" mt={1}>
                Você não pode alterar seu próprio cargo de Administrador.
              </Text>
            )}
          </FormControl>

          <Divider borderColor="gray.200" my={1} />

          {/* Seção de Redefinição de Senha */}
          <Box
            bg="gray.50"
            p={3.5}
            borderRadius="xl"
            borderWidth="1px"
            borderColor="gray.200"
          >
            <Flex justify="space-between" align="center" mb={changePassword ? 3 : 0}>
              <HStack gap={2}>
                <KeyRound size={16} color="#6366f1" />
                <Text fontSize="xs" fontWeight="bold" color="gray.800">
                  Redefinir Senha de Acesso
                </Text>
              </HStack>
              <Button
                size="xs"
                variant={changePassword ? 'solid' : 'outline'}
                colorScheme={changePassword ? 'brand' : 'gray'}
                onClick={() => {
                  setChangePassword(!changePassword);
                  if (!changePassword) handleGeneratePassword();
                }}
                borderRadius="lg"
                fontSize="2xs"
              >
                {changePassword ? 'Cancelar' : 'Alterar Senha'}
              </Button>
            </Flex>

            {changePassword && (
              <VStack align="stretch" gap={2} mt={2}>
                <FormControl>
                  <InputGroup size="sm">
                    <InputLeftElement pointerEvents="none" color="gray.400">
                      <Lock size={15} />
                    </InputLeftElement>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nova senha (mínimo 6 caracteres)"
                      borderRadius="lg"
                      fontSize="xs"
                      bg="white"
                      focusBorderColor="brand.500"
                    />
                    <InputRightElement>
                      <IconButton
                        size="xs"
                        variant="ghost"
                        aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                        icon={showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>

                <HStack justify="space-between" align="center">
                  <Text fontSize="3xs" color="gray.500">
                    Compartilhe a nova senha com o funcionário após salvar.
                  </Text>
                  <Button
                    size="xs"
                    variant="ghost"
                    color="brand.600"
                    fontSize="2xs"
                    leftIcon={<RotateCw size={12} />}
                    onClick={handleGeneratePassword}
                    p={1}
                    h="auto"
                  >
                    Gerar outra
                  </Button>
                </HStack>
              </VStack>
            )}
          </Box>
        </VStack>
      </ModalBody>

      <ModalFooter
        bg="gray.50"
        borderTopWidth="1px"
        borderColor="gray.200"
        py={3}
        px={6}
        gap={3}
      >
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          borderRadius="xl"
          fontSize="sm"
          color="gray.600"
          _hover={{ bg: 'gray.200' }}
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          size="sm"
          bg="brand.600"
          color="white"
          _hover={{ bg: 'brand.700' }}
          borderRadius="xl"
          fontSize="sm"
          fontWeight="bold"
          px={5}
          isLoading={loading}
          loadingText="Salvando..."
        >
          Salvar Alterações
        </Button>
      </ModalFooter>
    </ModalContent>
  );
};

export const EditCollaboratorModal: React.FC<EditCollaboratorModalProps> = ({
  isOpen,
  onClose,
  collaborator,
  onSuccess,
  currentUserId,
}) => {
  if (!collaborator) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <EditCollaboratorForm
        key={collaborator.id}
        collaborator={collaborator}
        onClose={onClose}
        onSuccess={onSuccess}
        currentUserId={currentUserId}
      />
    </Modal>
  );
};
