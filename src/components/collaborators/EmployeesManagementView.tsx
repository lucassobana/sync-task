'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  HStack,
  Badge,
  Spinner,
  IconButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Tooltip,
} from '@chakra-ui/react';
import {
  Users,
  Search,
  UserPlus,
  Edit2,
  Trash2,
  Shield,
  Briefcase,
  Eye,
  Calendar,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CollaboratorWithEmail, Profile, canManageEmployees } from '@/types/database';
import { getCollaboratorsListAction } from '@/app/actions/collaborators';
import { EditCollaboratorModal } from './EditCollaboratorModal';
import { DeleteCollaboratorDialog } from './DeleteCollaboratorDialog';
import { NewCollaboratorModal } from '../calendar/NewCollaboratorModal';

export function EmployeesManagementView() {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();

  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [collaborators, setCollaborators] = useState<CollaboratorWithEmail[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager' | 'user'>('all');

  // Modais
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<CollaboratorWithEmail | null>(null);
  const [deletingCollaborator, setDeletingCollaborator] = useState<CollaboratorWithEmail | null>(null);

  // 1. Inicializa autenticação e busca lista de funcionários
  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        setLoading(true);
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.push('/login');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!profile || !canManageEmployees(profile.role)) {
          toast({
            title: 'Acesso restrito',
            description: 'Apenas administradores podem acessar a gestão de funcionários.',
            status: 'error',
            duration: 4000,
            isClosable: true,
          });
          router.push('/');
          return;
        }

        if (!isMounted) return;
        setCurrentProfile(profile);

        const res = await getCollaboratorsListAction();
        if (!isMounted) return;

        if (res.success && res.collaborators) {
          setCollaborators(res.collaborators);
        } else if (res.error) {
          toast({
            title: 'Erro ao carregar lista',
            description: res.error,
            status: 'error',
            duration: 4000,
            isClosable: true,
          });
        }
      } catch {
        if (!isMounted) return;
        toast({
          title: 'Erro de conexão',
          description: 'Falha ao buscar dados do servidor.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    return () => {
      isMounted = false;
    };
  }, [supabase, router, toast]);

  // Função para recarregar lista após criar, editar ou excluir
  const refreshCollaborators = useCallback(async () => {
    try {
      const res = await getCollaboratorsListAction();
      if (res.success && res.collaborators) {
        setCollaborators(res.collaborators);
      }
    } catch {
      // Ignora erro em atualização silenciosa
    }
  }, []);

  // Estatísticas
  const stats = useMemo(() => {
    const total = collaborators.length;
    const admins = collaborators.filter((c) => c.role === 'admin').length;
    const managers = collaborators.filter((c) => c.role === 'manager' || c.role === 'editor').length;
    const viewers = collaborators.filter((c) => c.role === 'user' || c.role === 'viewer').length;
    return { total, admins, managers, viewers };
  }, [collaborators]);

  // Filtragem
  const filteredCollaborators = useMemo(() => {
    return collaborators.filter((collab) => {
      // Filtro de texto (nome ou email)
      const matchesSearch =
        collab.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (collab.email && collab.email.toLowerCase().includes(search.toLowerCase()));

      // Filtro de cargo
      let matchesRole = true;
      if (roleFilter === 'admin') matchesRole = collab.role === 'admin';
      else if (roleFilter === 'manager') matchesRole = collab.role === 'manager' || collab.role === 'editor';
      else if (roleFilter === 'user') matchesRole = collab.role === 'user' || collab.role === 'viewer';

      return matchesSearch && matchesRole;
    });
  }, [collaborators, search, roleFilter]);

  // Iniciais para avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <Badge
            colorScheme="purple"
            borderRadius="full"
            px={2.5}
            py={0.5}
            fontSize="2xs"
            fontWeight="bold"
            display="inline-flex"
            alignItems="center"
            gap={1}
          >
            <Shield size={12} />
            Administrador
          </Badge>
        );
      case 'manager':
      case 'editor':
        return (
          <Badge
            colorScheme="blue"
            borderRadius="full"
            px={2.5}
            py={0.5}
            fontSize="2xs"
            fontWeight="bold"
            display="inline-flex"
            alignItems="center"
            gap={1}
          >
            <Briefcase size={12} />
            Gestor de Tarefas
          </Badge>
        );
      case 'user':
      case 'viewer':
      default:
        return (
          <Badge
            colorScheme="gray"
            borderRadius="full"
            px={2.5}
            py={0.5}
            fontSize="2xs"
            fontWeight="bold"
            display="inline-flex"
            alignItems="center"
            gap={1}
          >
            <Eye size={12} />
            Visualizador
          </Badge>
        );
    }
  };

  return (
    <Box
      w="full"
      maxW="1400px"
      mx="auto"
      p={{ base: 4, md: 6 }}
      display="flex"
      flexDir="column"
      gap={6}
    >
      {/* Top Banner / Título e Ação Principal */}
      <Flex
        wrap="wrap"
        align="center"
        justify="space-between"
        gap={4}
        bg="white"
        p={{ base: 4, md: 6 }}
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="gray.200"
        boxShadow="sm"
      >
        <HStack gap={3.5} align="center">
          <Flex
            w={12}
            h={12}
            borderRadius="xl"
            bg="brand.50"
            color="brand.600"
            align="center"
            justify="center"
            borderWidth="1px"
            borderColor="brand.100"
          >
            <Users size={24} />
          </Flex>
          <Box>
            <Heading as="h1" fontSize={{ base: 'lg', md: 'xl' }} fontWeight="800" color="gray.900">
              Gestão de Funcionários
            </Heading>
            <Text fontSize="xs" color="gray.500" mt={0.5}>
              Cadastre, edite cargos, redefina senhas e gerencie permissões de acesso
            </Text>
          </Box>
        </HStack>

        <HStack gap={3}>
          <Button
            size="sm"
            variant="outline"
            borderColor="gray.300"
            color="gray.700"
            _hover={{ bg: 'gray.50' }}
            borderRadius="full"
            onClick={() => router.push('/')}
            leftIcon={<Calendar size={15} />}
          >
            Voltar ao Calendário
          </Button>

          <Button
            size="sm"
            bg="brand.600"
            color="white"
            _hover={{ bg: 'brand.700' }}
            borderRadius="full"
            fontWeight="bold"
            px={4}
            leftIcon={<UserPlus size={16} />}
            onClick={() => setIsNewModalOpen(true)}
          >
            Novo Funcionário
          </Button>
        </HStack>
      </Flex>

      {/* Cartões de Métricas / Resumo */}
      <Flex gap={4} wrap="wrap">
        <Box
          flex="1"
          minW="180px"
          bg="white"
          p={4}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.200"
          boxShadow="2xs"
        >
          <Text fontSize="xs" color="gray.500" fontWeight="semibold">
            Total de Funcionários
          </Text>
          <Text fontSize="2xl" fontWeight="800" color="gray.900" mt={1}>
            {stats.total}
          </Text>
        </Box>

        <Box
          flex="1"
          minW="180px"
          bg="white"
          p={4}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="purple.100"
          boxShadow="2xs"
        >
          <HStack justify="space-between">
            <Text fontSize="xs" color="purple.600" fontWeight="semibold">
              Administradores
            </Text>
            <Shield size={16} color="#9333ea" />
          </HStack>
          <Text fontSize="2xl" fontWeight="800" color="purple.700" mt={1}>
            {stats.admins}
          </Text>
        </Box>

        <Box
          flex="1"
          minW="180px"
          bg="white"
          p={4}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="blue.100"
          boxShadow="2xs"
        >
          <HStack justify="space-between">
            <Text fontSize="xs" color="blue.600" fontWeight="semibold">
              Gestores de Tarefas
            </Text>
            <Briefcase size={16} color="#2563eb" />
          </HStack>
          <Text fontSize="2xl" fontWeight="800" color="blue.700" mt={1}>
            {stats.managers}
          </Text>
        </Box>

        <Box
          flex="1"
          minW="180px"
          bg="white"
          p={4}
          borderRadius="xl"
          borderWidth="1px"
          borderColor="gray.200"
          boxShadow="2xs"
        >
          <HStack justify="space-between">
            <Text fontSize="xs" color="gray.500" fontWeight="semibold">
              Visualizadores
            </Text>
            <Eye size={16} color="#64748b" />
          </HStack>
          <Text fontSize="2xl" fontWeight="800" color="gray.700" mt={1}>
            {stats.viewers}
          </Text>
        </Box>
      </Flex>

      {/* Barra de Filtros e Busca */}
      <Flex
        wrap="wrap"
        align="center"
        justify="space-between"
        gap={3}
        bg="white"
        p={3.5}
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.200"
      >
        {/* Campo de Busca */}
        <InputGroup maxW={{ base: 'full', md: '350px' }} size="sm">
          <InputLeftElement pointerEvents="none" color="gray.400">
            <Search size={16} />
          </InputLeftElement>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            borderRadius="lg"
            focusBorderColor="brand.500"
          />
        </InputGroup>

        {/* Abas de Filtro de Cargo */}
        <HStack bg="gray.100" p={1} borderRadius="lg" gap={1} wrap="wrap">
          {(
            [
              { key: 'all', label: `Todos (${stats.total})` },
              { key: 'admin', label: `Admins (${stats.admins})` },
              { key: 'manager', label: `Gestores (${stats.managers})` },
              { key: 'user', label: `Visualizadores (${stats.viewers})` },
            ] as const
          ).map((item) => (
            <Button
              key={item.key}
              size="xs"
              variant="ghost"
              px={3}
              py={1.5}
              borderRadius="md"
              fontWeight={roleFilter === item.key ? 'bold' : 'medium'}
              bg={roleFilter === item.key ? 'white' : 'transparent'}
              color={roleFilter === item.key ? 'brand.600' : 'gray.600'}
              boxShadow={roleFilter === item.key ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'}
              _hover={{ color: roleFilter === item.key ? 'brand.600' : 'gray.900' }}
              onClick={() => setRoleFilter(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </HStack>
      </Flex>

      {/* Tabela de Funcionários */}
      <Box
        bg="white"
        borderRadius="2xl"
        borderWidth="1px"
        borderColor="gray.200"
        boxShadow="sm"
        overflow="hidden"
      >
        {loading ? (
          <Flex align="center" justify="center" py={20} gap={3}>
            <Spinner size="lg" color="brand.600" />
            <Text fontSize="sm" color="gray.500">
              Carregando lista de funcionários...
            </Text>
          </Flex>
        ) : filteredCollaborators.length === 0 ? (
          <Flex direction="column" align="center" justify="center" py={16} px={4} gap={3}>
            <Users size={48} color="#94a3b8" />
            <Text fontSize="md" fontWeight="bold" color="gray.700">
              Nenhum funcionário encontrado
            </Text>
            <Text fontSize="xs" color="gray.500">
              {search
                ? `Nenhum resultado corresponde à busca "${search}".`
                : 'Não há funcionários nesta categoria.'}
            </Text>
          </Flex>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple" size="sm">
              <Thead bg="gray.50">
                <Tr>
                  <Th py={3.5} color="gray.500" fontSize="2xs" fontWeight="bold">
                    Funcionário
                  </Th>
                  <Th py={3.5} color="gray.500" fontSize="2xs" fontWeight="bold">
                    E-mail
                  </Th>
                  <Th py={3.5} color="gray.500" fontSize="2xs" fontWeight="bold">
                    Cargo / Nível
                  </Th>
                  <Th py={3.5} color="gray.500" fontSize="2xs" fontWeight="bold" textAlign="center">
                    Tarefas Atribuídas
                  </Th>
                  <Th py={3.5} color="gray.500" fontSize="2xs" fontWeight="bold" textAlign="right">
                    Ações
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredCollaborators.map((collab) => {
                  const isCurrent = currentProfile?.id === collab.id;

                  return (
                    <Tr
                      key={collab.id}
                      _hover={{ bg: 'gray.50' }}
                      transition="background 0.15s ease"
                    >
                      {/* Avatar e Nome */}
                      <Td py={3.5}>
                        <HStack gap={3}>
                          <Flex
                            w={9}
                            h={9}
                            borderRadius="full"
                            align="center"
                            justify="center"
                            fontWeight="bold"
                            fontSize="xs"
                            bg={
                              collab.role === 'admin'
                                ? 'purple.100'
                                : collab.role === 'manager'
                                ? 'blue.100'
                                : 'gray.200'
                            }
                            color={
                              collab.role === 'admin'
                                ? 'purple.700'
                                : collab.role === 'manager'
                                ? 'blue.700'
                                : 'gray.700'
                            }
                            flexShrink={0}
                          >
                            {getInitials(collab.full_name)}
                          </Flex>
                          <Box>
                            <HStack gap={1.5}>
                              <Text fontSize="sm" fontWeight="semibold" color="gray.900">
                                {collab.full_name}
                              </Text>
                              {isCurrent && (
                                <Badge colorScheme="green" fontSize="3xs" borderRadius="full">
                                  Você
                                </Badge>
                              )}
                            </HStack>
                          </Box>
                        </HStack>
                      </Td>

                      {/* E-mail */}
                      <Td py={3.5}>
                        <Text fontSize="xs" color="gray.600">
                          {collab.email || '—'}
                        </Text>
                      </Td>

                      {/* Cargo */}
                      <Td py={3.5}>{getRoleBadge(collab.role)}</Td>

                      {/* Tarefas Atribuídas */}
                      <Td py={3.5} textAlign="center">
                        <Badge
                          variant="subtle"
                          colorScheme={collab.tasksCount && collab.tasksCount > 0 ? 'brand' : 'gray'}
                          borderRadius="full"
                          px={2}
                          fontSize="2xs"
                        >
                          {collab.tasksCount || 0} {collab.tasksCount === 1 ? 'tarefa' : 'tarefas'}
                        </Badge>
                      </Td>

                      {/* Botões de Ação */}
                      <Td py={3.5} textAlign="right">
                        <HStack justify="flex-end" gap={1.5}>
                          <Tooltip label="Editar dados e cargo" hasArrow placement="top">
                            <Button
                              size="xs"
                              variant="outline"
                              borderColor="gray.300"
                              color="gray.700"
                              _hover={{ bg: 'brand.50', color: 'brand.600', borderColor: 'brand.300' }}
                              borderRadius="lg"
                              leftIcon={<Edit2 size={13} />}
                              onClick={() => setEditingCollaborator(collab)}
                            >
                              Editar
                            </Button>
                          </Tooltip>

                          {!isCurrent && (
                            <Tooltip label="Excluir funcionário" hasArrow placement="top">
                              <IconButton
                                size="xs"
                                variant="ghost"
                                color="gray.400"
                                _hover={{ color: 'red.600', bg: 'red.50' }}
                                aria-label="Excluir funcionário"
                                icon={<Trash2 size={14} />}
                                onClick={() => setDeletingCollaborator(collab)}
                              />
                            </Tooltip>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Box>
        )}
      </Box>

      {/* Modal de Edição */}
      <EditCollaboratorModal
        isOpen={Boolean(editingCollaborator)}
        onClose={() => setEditingCollaborator(null)}
        collaborator={editingCollaborator}
        onSuccess={refreshCollaborators}
        currentUserId={currentProfile?.id}
      />

      {/* Diálogo de Exclusão */}
      <DeleteCollaboratorDialog
        isOpen={Boolean(deletingCollaborator)}
        onClose={() => setDeletingCollaborator(null)}
        collaborator={deletingCollaborator}
        onSuccess={refreshCollaborators}
      />

      {/* Modal de Criação de Novo Funcionário */}
      <NewCollaboratorModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={refreshCollaborators}
      />
    </Box>
  );
}
