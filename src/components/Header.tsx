'use client';

import React, { useEffect, useState } from 'react';
import { Flex, Image, Box, Text, Button } from '@chakra-ui/react';
import { Calendar, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types/database';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function getProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) setProfile(data);
    }

    getProfile();
  }, [supabase, pathname]);

  // Se estiver na tela de login, não exibe o cabeçalho superior
  if (pathname === '/login') {
    return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <Flex
      as="header"
      position="relative"
      justify="space-between"
      align="center"
      px={8}
      h="96px"
      bg="gray.900"
      borderBottom="1px"
      borderColor="gray.800"
      shadow="sm"
    >
      {/* Logo e Título (Esquerda) */}
      <Flex align="center" gap={4}>
        <NextLink href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <Image
            src="/sigma.svg"
            alt="Sigma Contabilidade"
            h="96px"
            w="120px"
            objectFit="contain"
          />
        </NextLink>
        <Box display={{ base: 'none', md: 'block' }} h="32px" w="1px" bg="gray.800" />
        <Text
          display={{ base: 'none', md: 'block' }}
          fontSize="sm"
          fontWeight="semibold"
          color="gray.400"
          letterSpacing="0.02em"
        >
          Calendário de Tarefas
        </Text>
      </Flex>

      {/* Menu de Navegação (Centro) */}
      <Flex
        gap={2}
        position="absolute"
        left="50%"
        transform="translateX(-50%)"
      >
        <NextLink href="/" style={{ textDecoration: 'none' }}>
          <Flex
            align="center"
            gap={2}
            px={4}
            py={2}
            borderRadius="lg"
            fontSize="sm"
            fontWeight={pathname === '/' ? '600' : '500'}
            bg={pathname === '/' ? 'gray.800' : 'transparent'}
            border="1px"
            borderColor={pathname === '/' ? 'gray.700' : 'transparent'}
            color={pathname === '/' ? 'white' : 'gray.400'}
            _hover={{ bg: 'gray.800', color: 'white' }}
            transition="all 0.2s"
          >
            <Calendar
              size={16}
              color={pathname === '/' ? '#818cf8' : '#94a3b8'}
            />
            Painel do Calendário
          </Flex>
        </NextLink>
      </Flex>

      {/* Perfil e Ações (Direita) */}
      <Flex align="center" gap={3}>
        {profile && (
          <Flex
            align="center"
            gap={2.5}
            bg="gray.800"
            border="1px solid"
            borderColor="gray.700"
            borderRadius="full"
            px={3.5}
            py={1.5}
          >
            <Text fontSize="xs" fontWeight="medium" color="gray.200">
              {profile.full_name}
            </Text>

            <Button
              size="xs"
              variant="ghost"
              p="1"
              color="gray.400"
              _hover={{ color: 'red.400', bg: 'gray.700' }}
              onClick={handleLogout}
              title="Sair da conta"
              aria-label="Sair"
            >
              <LogOut size={16} />
            </Button>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}
