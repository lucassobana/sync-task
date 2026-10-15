'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Box, Flex, HStack, VStack, Text, Input } from '@chakra-ui/react';
import { Users, ChevronDown, Check, Search } from 'lucide-react';
import { Profile } from '@/types/database';

interface CollaboratorSelectProps {
  profiles: Profile[];
  selectedUserId: string;
  onSelectUserChange: (userId: string) => void;
  allowAll?: boolean;
}

export const CollaboratorSelect: React.FC<CollaboratorSelectProps> = ({
  profiles,
  selectedUserId,
  onSelectUserChange,
  allowAll = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedProfile = profiles.find((p) => p.id === selectedUserId);
  const isAllSelected = allowAll && selectedUserId === 'all';

  // Filtro de busca na lista de colaboradores
  const filteredProfiles = profiles.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <Box position="relative" ref={dropdownRef}>
      {/* Botão Gatilho (Trigger) */}
      <Flex
        as="div"
        role="button"
        tabIndex={0}
        align="center"
        justify="space-between"
        gap={2.5}
        px={3}
        py={1.5}
        bg="white"
        borderWidth="1px"
        borderColor={isOpen ? 'brand.600' : 'gray.200'}
        borderRadius="lg"
        boxShadow={isOpen ? '0 0 0 2px rgba(79, 70, 229, 0.15)' : 'none'}
        cursor="pointer"
        transition="all 0.15s ease"
        _hover={{ borderColor: 'gray.300', bg: 'gray.50' }}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        aria-expanded={isOpen}
        w="full"
        userSelect="none"
      >
        <HStack gap={2.5}>
          <Flex
            w={6}
            h={6}
            borderRadius="full"
            align="center"
            justify="center"
            bg={isAllSelected ? 'gray.100' : selectedProfile?.role === 'manager' ? 'orange.100' : 'brand.50'}
            color={isAllSelected ? 'gray.600' : selectedProfile?.role === 'manager' ? 'orange.700' : 'brand.700'}
            fontSize="2xs"
            fontWeight="bold"
          >
            {isAllSelected ? (
              <Users size={13} />
            ) : (
              getInitials(selectedProfile?.full_name || 'U')
            )}
          </Flex>

          <VStack align="flex-start" gap={0} textAlign="left">
            <Text fontSize="2xs" color="gray.400" fontWeight="medium" lineHeight="1">
              Funcionário
            </Text>
            <Text
              fontSize="xs"
              fontWeight="semibold"
              color="gray.900"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
              maxW="150px"
            >
              {isAllSelected
                ? 'Todos os funcionários'
                : selectedProfile?.full_name || 'Selecione um funcionário'}
            </Text>
          </VStack>
        </HStack>

        <Box
          color="gray.400"
          transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
          transition="transform 0.2s ease"
          ml={1}
        >
          <ChevronDown size={15} />
        </Box>
      </Flex>

      {/* Menu Dropdown Flutuante */}
      {isOpen && (
        <Box
          position="absolute"
          top="calc(100% + 6px)"
          right={0}
          w="280px"
          bg="white"
          borderWidth="1px"
          borderColor="gray.200"
          borderRadius="xl"
          boxShadow="0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
          zIndex={50}
          overflow="hidden"
        >
          {/* Campo de Busca Rápida (exibido se houver mais de 3 colaboradores) */}
          {profiles.length > 3 && (
            <Box p={2.5} borderBottomWidth="1px" borderColor="gray.100">
              <Flex
                align="center"
                bg="gray.50"
                borderRadius="md"
                px={2.5}
                py={1}
                borderWidth="1px"
                borderColor="gray.200"
              >
                <Search size={14} color="#94a3b8" />
                <Input
                  size="xs"
                  border="none"
                  _focus={{ outline: 'none', boxShadow: 'none' }}
                  placeholder="Buscar funcionário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  px={2}
                />
              </Flex>
            </Box>
          )}

          <Box maxH="240px" overflowY="auto" p={1.5}>
            {/* Opção: Todos os Funcionários (apenas se allowAll for true) */}
            {allowAll && (
              <>
                <Flex
                  align="center"
                  justify="space-between"
                  p={2}
                  borderRadius="lg"
                  cursor="pointer"
                  bg={isAllSelected ? 'gray.100' : 'transparent'}
                  _hover={{ bg: isAllSelected ? 'gray.100' : 'gray.50' }}
                  transition="all 0.15s ease"
                  onClick={() => {
                    onSelectUserChange('all');
                    setIsOpen(false);
                  }}
                >
                  <HStack gap={2.5}>
                    <Flex
                      w={7}
                      h={7}
                      borderRadius="full"
                      bg="gray.100"
                      color="gray.600"
                      align="center"
                      justify="center"
                    >
                      <Users size={14} />
                    </Flex>
                    <VStack align="flex-start" gap={0}>
                      <Text fontSize="xs" fontWeight="semibold" color="gray.900">
                        Todos os funcionários
                      </Text>
                      <Text fontSize="2xs" color="gray.500">
                        Visualização geral da equipe
                      </Text>
                    </VStack>
                  </HStack>
                  {isAllSelected && <Check size={16} color="#4f46e5" />}
                </Flex>
                <Box my={1} borderBottomWidth="1px" borderColor="gray.100" />
              </>
            )}

            {/* Lista Filtrada de Usuários */}
            {filteredProfiles.map((p) => {
              const isSelected = selectedUserId === p.id;
              const roleBg =
                p.role === 'admin'
                  ? 'purple.100'
                  : p.role === 'manager'
                  ? 'orange.100'
                  : 'brand.100';
              const roleColor =
                p.role === 'admin'
                  ? 'purple.700'
                  : p.role === 'manager'
                  ? 'orange.700'
                  : 'brand.700';

              return (
                <Flex
                  key={p.id}
                  align="center"
                  justify="space-between"
                  p={2}
                  borderRadius="lg"
                  cursor="pointer"
                  bg={isSelected ? 'brand.50' : 'transparent'}
                  _hover={{ bg: isSelected ? 'brand.50' : 'gray.50' }}
                  transition="all 0.15s ease"
                  onClick={() => {
                    onSelectUserChange(p.id);
                    setIsOpen(false);
                  }}
                >
                  <HStack gap={2.5}>
                    <Flex
                      w={7}
                      h={7}
                      borderRadius="full"
                      bg={roleBg}
                      color={roleColor}
                      align="center"
                      justify="center"
                      fontSize="2xs"
                      fontWeight="bold"
                    >
                      {getInitials(p.full_name)}
                    </Flex>

                    <VStack align="flex-start" gap={0.5}>
                      <Text
                        fontSize="xs"
                        fontWeight={isSelected ? 'bold' : 'medium'}
                        color={isSelected ? 'brand.700' : 'gray.900'}
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        maxW="140px"
                      >
                        {p.full_name}
                      </Text>
                    </VStack>
                  </HStack>

                  {isSelected && <Check size={16} color="#4f46e5" />}
                </Flex>
              );
            })}

            {filteredProfiles.length === 0 && (
              <Box p={3} textAlign="center">
                <Text fontSize="xs" color="gray.400">
                  Nenhum funcionário encontrado
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};
