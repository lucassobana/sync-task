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
  Text,
} from '@chakra-ui/react';
import { UserPlus, User, Mail, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { createCollaboratorAction } from '@/app/actions/collaborators';
import { Profile } from '@/types/database';

interface NewCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProfile?: Profile) => void;
}

export const NewCollaboratorModal: React.FC<NewCollaboratorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'user'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const toast = useToast();

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('user');
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let generated = '';
    for (let i = 0; i < 8; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve conter no mínimo 6 caracteres.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setLoading(true);
      const res = await createCollaboratorAction({
        fullName,
        email,
        password,
        role,
      });

      if (!res.success) {
        toast({
          title: 'Erro ao cadastrar',
          description: res.error || 'Não foi possível cadastrar o funcionário.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
        return;
      }

      toast({
        title: 'Funcionário cadastrado!',
        description: res.warning || `${fullName} já pode acessar o sistema com o e-mail e senha cadastrados.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });

      handleClose();
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao processar o cadastro.';
      toast({
        title: 'Erro no sistema',
        description: message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} isCentered size="md">
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(4px)" />
      <ModalContent
        as="form"
        onSubmit={handleSubmit}
        borderRadius="2xl"
        boxShadow="2xl"
        border="1px"
        borderColor="gray.100"
        overflow="hidden"
        mx={4}
      >
        <ModalHeader
          borderBottom="1px"
          borderColor="gray.100"
          py={4}
          px={6}
          bg="gray.50"
        >
          <HStack gap={2.5}>
            <UserPlus size={20} color="#4f46e5" />
            <Text fontSize="lg" fontWeight="bold" color="gray.900">
              Cadastrar Novo Funcionário
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton top={4} right={4} />

        <ModalBody p={6}>
          <VStack spacing={4} align="stretch">
            {/* Nome Completo */}
            <FormControl isRequired>
              <FormLabel fontSize="xs" fontWeight="bold" color="gray.700" textTransform="uppercase" letterSpacing="wider">
                Nome Completo
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" color="gray.400">
                  <User size={18} />
                </InputLeftElement>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo"
                  borderRadius="xl"
                  focusBorderColor="brand.500"
                  fontSize="sm"
                />
              </InputGroup>
            </FormControl>

            {/* E-mail de Acesso */}
            <FormControl isRequired>
              <FormLabel fontSize="xs" fontWeight="bold" color="gray.700" textTransform="uppercase" letterSpacing="wider">
                E-mail de Acesso
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" color="gray.400">
                  <Mail size={18} />
                </InputLeftElement>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="carlos@empresa.com"
                  borderRadius="xl"
                  focusBorderColor="brand.500"
                  fontSize="sm"
                />
              </InputGroup>
            </FormControl>

            {/* Senha Inicial */}
            <FormControl isRequired>
              <HStack justify="space-between" mb={1}>
                <FormLabel fontSize="xs" fontWeight="bold" color="gray.700" textTransform="uppercase" letterSpacing="wider" m={0}>
                  Senha Inicial
                </FormLabel>
                <Button
                  size="2xs"
                  variant="ghost"
                  color="brand.600"
                  fontWeight="bold"
                  onClick={handleGeneratePassword}
                  _hover={{ bg: 'brand.50' }}
                >
                  Gerar Senha
                </Button>
              </HStack>
              <InputGroup>
                <InputLeftElement pointerEvents="none" color="gray.400">
                  <Lock size={18} />
                </InputLeftElement>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  borderRadius="xl"
                  focusBorderColor="brand.500"
                  fontSize="sm"
                />
                <InputRightElement>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                    icon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    onClick={() => setShowPassword(!showPassword)}
                    color="gray.500"
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            {/* Nível de Acesso (Cargo) */}
            <FormControl>
              <FormLabel fontSize="xs" fontWeight="bold" color="gray.700" textTransform="uppercase" letterSpacing="wider">
                Nível de Permissão
              </FormLabel>
              <InputGroup>
                <InputLeftElement pointerEvents="none" color="gray.400">
                  <Shield size={18} />
                </InputLeftElement>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'manager' | 'user')}
                  borderRadius="xl"
                  focusBorderColor="brand.500"
                  fontSize="sm"
                  pl={10}
                >
                  <option value="user">Visualizador (apenas visualiza suas próprias tarefas)</option>
                  <option value="manager">Gestor de Tarefas (cria e edita tarefas para a equipe)</option>
                  <option value="admin">Administrador (acesso total: cadastra funcionários e tarefas)</option>
                </Select>
              </InputGroup>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter
          borderTop="1px"
          borderColor="gray.100"
          py={3.5}
          px={6}
          bg="gray.50"
          gap={3}
        >
          <Button
            variant="ghost"
            onClick={handleClose}
            borderRadius="xl"
            fontSize="sm"
            color="gray.600"
            _hover={{ bg: 'gray.200' }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            bg="brand.600"
            color="white"
            _hover={{ bg: 'brand.700' }}
            borderRadius="xl"
            fontSize="sm"
            fontWeight="bold"
            px={5}
            isLoading={loading}
            loadingText="Cadastrando..."
          >
            Cadastrar Funcionário
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
